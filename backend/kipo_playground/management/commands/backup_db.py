"""
Management command para backup e restore do banco de dados T.E.I.A.
Suporta PostgreSQL (produção) e SQLite (desenvolvimento).
Inclui rotação automática (política 7/4/12/5) e teste de restore.

Uso:
    python manage.py backup_db                    # Backup completo (BD + media)
    python manage.py backup_db --db-only          # Apenas banco de dados
    python manage.py backup_db --media-only       # Apenas arquivos de mídia
    python manage.py backup_db --list             # Lista backups existentes
    python manage.py backup_db --restore <arquivo> # Restaura backup (EXIGE CONFIRMAÇÃO)
    python manage.py backup_db --test-restore <arquivo> # Testa restore em BD temporário
    python manage.py backup_db --rotate           # Aplica política de retenção (7/4/12/5)
"""
import os
import shutil
import subprocess
import gzip
import tarfile
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import connections

try:
    import psycopg2
    PG_AVAILABLE = True
except ImportError:
    PG_AVAILABLE = False


class Command(BaseCommand):
    help = 'Backup e restore do banco de dados e mídia T.E.I.A.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--db-only',
            action='store_true',
            help='Faz backup apenas do banco de dados (sem mídia)',
        )
        parser.add_argument(
            '--media-only',
            action='store_true',
            help='Faz backup apenas dos arquivos de mídia (sem BD)',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='Lista backups existentes com metadados',
        )
        parser.add_argument(
            '--restore',
            type=str,
            metavar='ARQUIVO',
            help='Restaura backup (arquivo .tar.gz ou .sql.gz). EXIGE --confirm',
        )
        parser.add_argument(
            '--test-restore',
            type=str,
            metavar='ARQUIVO',
            help='Testa restore em banco temporário (não afeta produção)',
        )
        parser.add_argument(
            '--rotate',
            action='store_true',
            help='Aplica política de retenção: 7 diários, 4 semanais, 12 mensais, 5 anuais',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirma restauração destrutiva (obrigatório para --restore)',
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default=None,
            help='Diretório de saída (padrão: BACKUP_ROOT ou ./backups/)',
        )
        parser.add_argument(
            '--compress',
            action='store_true',
            default=True,
            help='Comprime com gzip (padrão: True)',
        )
        parser.add_argument(
            '--no-compress',
            action='store_false',
            dest='compress',
            help='Não comprime output',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.db_config = settings.DATABASES['default']
        self.engine = self.db_config['ENGINE']
        self.is_postgres = 'postgresql' in self.engine
        self.is_sqlite = 'sqlite3' in self.engine

        # Diretório de backups
        self.backup_root = Path(
            getattr(settings, 'BACKUP_ROOT', None) or
            os.environ.get('BACKUP_ROOT') or
            Path(settings.BASE_DIR).parent / 'backups'
        )
        self.backup_root.mkdir(parents=True, exist_ok=True)

        # Metadados
        self.meta_file = self.backup_root / 'backup_metadata.json'
        self.metadata = self._load_metadata()

    def _load_metadata(self):
        if self.meta_file.exists():
            try:
                return json.loads(self.meta_file.read_text())
            except Exception:
                return {'backups': []}
        return {'backups': []}

    def _save_metadata(self):
        self.meta_file.write_text(json.dumps(self.metadata, indent=2, default=str))

    def _timestamp(self):
        return datetime.now().strftime('%Y%m%d_%H%M%S')

    def _date_label(self, dt=None):
        dt = dt or datetime.now()
        return {
            'daily': dt.strftime('%Y%m%d'),
            'weekly': f"W{dt.isocalendar().week:02d}_{dt.year}",
            'monthly': dt.strftime('%Y%m'),
            'yearly': str(dt.year),
        }

    def _calc_hash(self, filepath):
        """SHA256 do arquivo para verificação de integridade"""
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

    def _run_cmd(self, cmd, capture=True):
        """Executa comando shell com logging"""
        self.stdout.write(f'  $ {cmd}')
        result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
        if result.returncode != 0:
            raise CommandError(f'Comando falhou (exit {result.returncode}):\n{result.stderr}')
        return result

    # ============================================================
    # BACKUP
    # ============================================================
    def _backup_postgres(self, output_path, compress=True):
        """Backup PostgreSQL usando pg_dump"""
        db = self.db_config
        env = os.environ.copy()
        if db.get('PASSWORD'):
            env['PGPASSWORD'] = db['PASSWORD']

        host = db.get('HOST', 'localhost')
        port = db.get('PORT', '5432')
        user = db.get('USER', 'postgres')
        name = db.get('NAME', 'teia')

        cmd = [
            'pg_dump',
            '-h', host,
            '-p', str(port),
            '-U', user,
            '-d', name,
            '--no-owner',      # Não incluir comandos OWNER
            '--no-privileges', # Não incluir GRANT/REVOKE
            '--clean',         # Incluir DROP antes de CREATE
            '--if-exists',     # DROP IF EXISTS
            '--format=custom', # Formato custom (mais rápido, permite restore paralelo)
        ]

        if compress:
            output_file = f'{output_path}.dump.gz'
            # pg_dump custom format já é comprimido; usamos gzip extra para .sql
            # Para custom format, salvamos direto
            cmd.extend(['-f', output_file.replace('.gz', '')])
            self._run_cmd(' '.join(cmd), capture=False)
            # Comprimir o dump custom
            with open(output_file.replace('.gz', ''), 'rb') as f_in:
                with gzip.open(output_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            os.remove(output_file.replace('.gz', ''))
        else:
            output_file = f'{output_path}.dump'
            cmd.extend(['-f', output_file])
            self._run_cmd(' '.join(cmd), capture=False)

        return output_file

    def _backup_sqlite(self, output_path, compress=True):
        """Backup SQLite - copia arquivo + vacuum"""
        db_path = Path(self.db_config['NAME'])
        if not db_path.exists():
            raise CommandError(f'SQLite não encontrado: {db_path}')

        # Vacuum antes do backup para otimizar
        with connections['default'].cursor() as cursor:
            cursor.execute('VACUUM')

        output_file = f'{output_path}.sqlite3'
        if compress:
            output_file += '.gz'
            with open(db_path, 'rb') as f_in:
                with gzip.open(output_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
        else:
            shutil.copy2(db_path, output_file)

        return output_file

    def _backup_media(self, output_path, compress=True):
        """Backup da pasta media (arquivos uploadados)"""
        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.exists():
            self.stdout.write(self.style.WARNING(f'  ⚠ MEDIA_ROOT não existe: {media_root}'))
            return None

        output_file = f'{output_path}_media.tar'
        if compress:
            output_file += '.gz'
            with tarfile.open(output_file, 'w:gz') as tar:
                tar.add(media_root, arcname='media')
        else:
            with tarfile.open(output_file, 'w') as tar:
                tar.add(media_root, arcname='media')

        return output_file

    def _create_backup_manifest(self, backup_files, backup_type, timestamp):
        """Cria manifest JSON com metadados do backup"""
        manifest = {
            'timestamp': timestamp,
            'datetime': datetime.now().isoformat(),
            'type': backup_type,  # 'full', 'db-only', 'media-only'
            'engine': self.engine,
            'database': self.db_config.get('NAME'),
            'files': [],
            'total_size': 0,
        }

        for f in backup_files:
            if f and Path(f).exists():
                stat = Path(f).stat()
                manifest['files'].append({
                    'path': f,
                    'name': Path(f).name,
                    'size': stat.st_size,
                    'sha256': self._calc_hash(f),
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
                manifest['total_size'] += stat.st_size

        manifest_file = f'{backup_files[0].replace("_media.tar.gz", "").replace(".dump.gz", "").replace(".sqlite3.gz", "")}_manifest.json'
        Path(manifest_file).write_text(json.dumps(manifest, indent=2))
        return manifest_file

    def handle_backup(self, options):
        db_only = options['db_only']
        media_only = options['media_only']
        compress = options['compress']
        output_dir = Path(options['output_dir']) if options['output_dir'] else self.backup_root
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = self._timestamp()
        base_name = output_dir / f'teia_backup_{timestamp}'
        backup_files = []

        self.stdout.write(self.style.NOTICE(f'\n=== BACKUP T.E.I.A. ==='))
        self.stdout.write(f'Timestamp: {timestamp}')
        self.stdout.write(f'Destino: {output_dir}')
        self.stdout.write(f'Tipo: {"DB apenas" if db_only else "Mídia apenas" if media_only else "Completo (DB + Mídia)"}')
        self.stdout.write(f'Compressão: {"Sim" if compress else "Não"}')
        self.stdout.write(f'Engine: {self.engine}')

        # 1. Backup Banco de Dados
        if not media_only:
            self.stdout.write('\n📦 Backing up database...')
            if self.is_postgres:
                if not PG_AVAILABLE:
                    raise CommandError('psycopg2 não instalado. Instale: pip install psycopg2-binary')
                db_file = self._backup_postgres(str(base_name), compress)
                backup_files.append(db_file)
                self.stdout.write(self.style.SUCCESS(f'  ✓ PostgreSQL dump: {Path(db_file).name}'))
            elif self.is_sqlite:
                db_file = self._backup_sqlite(str(base_name), compress)
                backup_files.append(db_file)
                self.stdout.write(self.style.SUCCESS(f'  ✓ SQLite copy: {Path(db_file).name}'))
            else:
                raise CommandError(f'Engine não suportado: {self.engine}')

        # 2. Backup Mídia
        if not db_only:
            self.stdout.write('\n📁 Backing up media files...')
            media_file = self._backup_media(str(base_name), compress)
            if media_file:
                backup_files.append(media_file)
                self.stdout.write(self.style.SUCCESS(f'  ✓ Media archive: {Path(media_file).name}'))

        # 3. Manifest
        backup_type = 'db-only' if db_only else 'media-only' if media_only else 'full'
        manifest_file = self._create_backup_manifest(backup_files, backup_type, timestamp)
        backup_files.append(manifest_file)
        self.stdout.write(self.style.SUCCESS(f'  ✓ Manifest: {Path(manifest_file).name}'))

        # 4. Registrar metadados
        total_size = sum(Path(f).stat().st_size for f in backup_files if Path(f).exists())
        self.metadata['backups'].append({
            'timestamp': timestamp,
            'datetime': datetime.now().isoformat(),
            'type': backup_type,
            'files': [Path(f).name for f in backup_files],
            'total_size': total_size,
            'manifest': Path(manifest_file).name,
            'directory': str(output_dir),
        })
        self._save_metadata()

        self.stdout.write(self.style.SUCCESS(f'\n✅ BACKUP CONCLUÍDO'))
        self.stdout.write(f'   Arquivos: {len(backup_files)}')
        self.stdout.write(f'   Tamanho total: {total_size / 1024 / 1024:.2f} MB')
        self.stdout.write(f'   Manifest: {manifest_file}')

        return backup_files

    # ============================================================
    # LIST
    # ============================================================
    def handle_list(self, options):
        self.stdout.write(self.style.NOTICE('\n=== BACKUPS EXISTENTES ==='))
        self.stdout.write(f'Diretório: {self.backup_root}\n')

        if not self.metadata['backups']:
            self.stdout.write('  (nenhum backup registrado)')
            return

        # Também escanear arquivos físicos
        physical_files = list(self.backup_root.glob('teia_backup_*'))
        physical_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

        for i, backup in enumerate(self.metadata['backups']):
            dt = backup['datetime'][:19].replace('T', ' ')
            size_mb = backup['total_size'] / 1024 / 1024
            self.stdout.write(f'  {i+1}. [{backup["type"].upper()}] {dt} — {size_mb:.1f} MB — {len(backup["files"])} arquivos')
            for f in backup['files']:
                fp = self.backup_root / f
                exists = '✓' if fp.exists() else '✗ FALTANDO'
                self.stdout.write(f'      {exists}  {f}')

        # Mostrar órfãos (arquivos físicos sem metadados)
        registered = set()
        for b in self.metadata['backups']:
            registered.update(b['files'])

        orphans = [f.name for f in physical_files if f.name not in registered and not f.name.endswith('.json')]
        if orphans:
            self.stdout.write(self.style.WARNING('\n  ⚠ Arquivos órfãos (sem metadata):'))
            for f in orphans:
                self.stdout.write(f'      {f}')

    # ============================================================
    # RESTORE
    # ============================================================
    def handle_restore(self, options):
        backup_file = options['restore']
        confirm = options['confirm']

        if not confirm:
            raise CommandError(
                '⚠ RESTAURAÇÃO DESTRUTIVA — IRREVERSÍVEL!\n'
                'Esta operação IRÁ SOBRESCREVER o banco de dados atual.\n'
                'Para confirmar, execute novamente com: --confirm'
            )

        backup_path = Path(backup_file)
        if not backup_path.is_absolute():
            backup_path = self.backup_root / backup_file

        if not backup_path.exists():
            raise CommandError(f'Arquivo não encontrado: {backup_path}')

        # Encontrar manifest associado
        manifest_path = backup_path.with_name(backup_path.stem.replace('_media', '').replace('.dump', '') + '_manifest.json')
        if not manifest_path.exists():
            # Tentar pelo timestamp no nome
            for meta in self.metadata['backups']:
                if backup_path.name in meta['files']:
                    manifest_path = self.backup_root / meta['manifest']
                    break

        if manifest_path and manifest_path.exists():
            manifest = json.loads(manifest_path.read_text())
            self.stdout.write(self.style.NOTICE(f'\n=== RESTAURAÇÃO ==='))
            self.stdout.write(f'Backup: {manifest["datetime"][:19]} (tipo: {manifest["type"]})')
            self.stdout.write(f'Arquivos: {", ".join(Path(f).name for f in manifest["files"])}')
        else:
            self.stdout.write(self.style.WARNING('⚠ Manifest não encontrado — prosseguindo sem verificação de integridade'))

        # Confirmação final interativa
        self.stdout.write(self.style.ERROR('\n⚠️  ATENÇÃO: ESTA OPERAÇÃO IRÁ APAGAR TODOS OS DADOS ATUAIS!'))
        self.stdout.write('   Digite "CONFIRMO RESTAURACAO" para prosseguir: ')
        user_input = input().strip()
        if user_input != 'CONFIRMO RESTAURACAO':
            raise CommandError('Restauração cancelada pelo usuário.')

        # 1. Restore Database
        db_files = [f for f in manifest.get('files', []) if f.endswith(('.dump.gz', '.sqlite3.gz', '.dump', '.sqlite3'))]
        if db_files and not options.get('media_only', False):
            db_file = self.backup_root / db_files[0]
            self.stdout.write(f'\n🔄 Restaurando banco de dados: {db_file.name}')
            if self.is_postgres:
                self._restore_postgres(db_file)
            elif self.is_sqlite:
                self._restore_sqlite(db_file)

        # 2. Restore Media
        media_files = [f for f in manifest.get('files', []) if '_media.tar' in f]
        if media_files and not options.get('db_only', False):
            media_file = self.backup_root / media_files[0]
            self.stdout.write(f'\n🔄 Restaurando mídia: {media_file.name}')
            self._restore_media(media_file)

        self.stdout.write(self.style.SUCCESS('\n✅ RESTAURAÇÃO CONCLUÍDA'))
        self.stdout.write('   Recomendado: reiniciar aplicação (systemctl restart / docker-compose restart)')

    def _restore_postgres(self, dump_file):
        """Restaura PostgreSQL a partir de pg_dump custom format (.dump.gz ou .dump)"""
        db = self.db_config
        env = os.environ.copy()
        if db.get('PASSWORD'):
            env['PGPASSWORD'] = db['PASSWORD']

        host = db.get('HOST', 'localhost')
        port = db.get('PORT', '5432')
        user = db.get('USER', 'postgres')
        name = db.get('NAME', 'teia')

        # Descomprimir se .gz
        if dump_file.suffix == '.gz':
            import gzip
            temp_dump = dump_file.with_suffix('')
            self.stdout.write(f'  Descomprimindo {dump_file.name}...')
            with gzip.open(dump_file, 'rb') as f_in:
                with open(temp_dump, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            dump_file = temp_dump

        # pg_restore com clean (drop objects first)
        cmd = [
            'pg_restore',
            '-h', host,
            '-p', str(port),
            '-U', user,
            '-d', name,
            '--clean',           # DROP antes de CREATE
            '--if-exists',       # DROP IF EXISTS
            '--no-owner',        # Ignorar owner original
            '--no-privileges',   # Ignorar privileges
            '--jobs=4',          # Paralelo (ajuste conforme CPU)
            str(dump_file),
        ]

        self._run_cmd(' '.join(cmd), capture=False)

        # Limpar temp se descomprimiu
        if dump_file != Path(dump_file).resolve() and dump_file.exists():
            dump_file.unlink(missing_ok=True)

        self.stdout.write(self.style.SUCCESS('  ✓ PostgreSQL restaurado'))

    def _restore_sqlite(self, dump_file):
        """Restaura SQLite copiando arquivo"""
        db_path = Path(self.db_config['NAME'])

        # Backup do atual (safety)
        safety_backup = db_path.with_suffix(f'.pre_restore_{self._timestamp()}.sqlite3')
        shutil.copy2(db_path, safety_backup)
        self.stdout.write(f'  Safety backup: {safety_backup.name}')

        # Descomprimir se .gz
        if dump_file.suffix == '.gz':
            import gzip
            temp_dump = dump_file.with_suffix('')
            with gzip.open(dump_file, 'rb') as f_in:
                with open(temp_dump, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            dump_file = temp_dump

        # Substituir
        shutil.copy2(dump_file, db_path)

        if dump_file != Path(dump_file).resolve() and dump_file.exists():
            dump_file.unlink(missing_ok=True)

        self.stdout.write(self.style.SUCCESS('  ✓ SQLite restaurado'))

    def _restore_media(self, archive_file):
        """Extrai archive de mídia para MEDIA_ROOT"""
        media_root = Path(settings.MEDIA_ROOT)

        # Backup safety
        if media_root.exists():
            safety_backup = media_root.parent / f'media_pre_restore_{self._timestamp()}'
            shutil.move(str(media_root), str(safety_backup))
            self.stdout.write(f'  Safety backup: {safety_backup.name}')

        media_root.mkdir(parents=True, exist_ok=True)

        # Extrair
        mode = 'r:gz' if archive_file.suffix == '.gz' else 'r'
        with tarfile.open(archive_file, mode) as tar:
            tar.extractall(path=media_root.parent)

        self.stdout.write(self.style.SUCCESS('  ✓ Mídia restaurada'))

    # ============================================================
    # TEST RESTORE (em BD temporário)
    # ============================================================
    def handle_test_restore(self, options):
        backup_file = options['test_restore']
        backup_path = Path(backup_file)
        if not backup_path.is_absolute():
            backup_path = self.backup_root / backup_file

        if not backup_path.exists():
            raise CommandError(f'Arquivo não encontrado: {backup_path}')

        self.stdout.write(self.style.NOTICE('\n=== TESTE DE RESTAURAÇÃO (BD TEMPORÁRIO) ==='))

        # Criar BD temporário
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            if self.is_postgres:
                # Para Postgres, criar BD temporário no mesmo servidor
                import psycopg2
                from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

                test_db = f'teia_test_restore_{self._timestamp()}'
                conn = psycopg2.connect(
                    host=db.get('HOST', 'localhost'),
                    port=db.get('PORT', '5432'),
                    user=db.get('USER', 'postgres'),
                    password=db.get('PASSWORD'),
                    database='postgres'
                )
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cur = conn.cursor()
                cur.execute(f'DROP DATABASE IF EXISTS {test_db}')
                cur.execute(f'CREATE DATABASE {test_db}')
                cur.close()
                conn.close()

                # Restaurar no BD de teste
                env = os.environ.copy()
                env['PGPASSWORD'] = db.get('PASSWORD', '')
                dump_file = backup_path
                if dump_file.suffix == '.gz':
                    import gzip
                    temp_dump = Path(tmpdir) / 'restore.dump'
                    with gzip.open(dump_file, 'rb') as f_in:
                        with open(temp_dump, 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    dump_file = temp_dump

                cmd = f'pg_restore -h {db.get("HOST")} -p {db.get("PORT")} -U {db.get("USER")} -d {test_db} --clean --if-exists --no-owner --no-privileges {dump_file}'
                subprocess.run(cmd, shell=True, env=env, check=True)

                # Verificar tabelas
                conn = psycopg2.connect(host=db.get('HOST'), port=db.get('PORT'), user=db.get('USER'), password=db.get('PASSWORD'), database=test_db)
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
                table_count = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM auth_user")
                user_count = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM kipo_playground_producao")
                prod_count = cur.fetchone()[0]
                cur.close()
                conn.close()

                # Limpar BD de teste
                conn = psycopg2.connect(host=db.get('HOST'), port=db.get('PORT'), user=db.get('USER'), password=db.get('PASSWORD'), database='postgres')
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cur = conn.cursor()
                cur.execute(f'DROP DATABASE {test_db}')
                cur.close()
                conn.close()

                self.stdout.write(self.style.SUCCESS(f'\n✅ TESTE OK — BD temporário validado:'))
                self.stdout.write(f'   Tabelas: {table_count}')
                self.stdout.write(f'   Usuários: {user_count}')
                self.stdout.write(f'   Produções: {prod_count}')

            elif self.is_sqlite:
                # SQLite: restaurar em arquivo temporário
                test_db = Path(tmpdir) / 'test_restore.sqlite3'
                if backup_path.suffix == '.gz':
                    import gzip
                    with gzip.open(backup_path, 'rb') as f_in:
                        with open(test_db, 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                else:
                    shutil.copy2(backup_path, test_db)

                # Verificar
                import sqlite3
                conn = sqlite3.connect(test_db)
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
                table_count = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM auth_user")
                user_count = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM kipo_playground_producao")
                prod_count = cur.fetchone()[0]
                conn.close()

                self.stdout.write(self.style.SUCCESS(f'\n✅ TESTE OK — SQLite temporário validado:'))
                self.stdout.write(f'   Tabelas: {table_count}')
                self.stdout.write(f'   Usuários: {user_count}')
                self.stdout.write(f'   Produções: {prod_count}')

    # ============================================================
    # ROTATE (Política 7/4/12/5)
    # ============================================================
    def handle_rotate(self, options):
        self.stdout.write(self.style.NOTICE('\n=== ROTAÇÃO DE BACKUPS (Política 7/4/12/5) ==='))
        self.stdout.write('  Diários: 7 mais recentes')
        self.stdout.write('  Semanais: 4 (domingos) mais recentes')
        self.stdout.write('  Mensais: 12 (dia 1) mais recentes')
        self.stdout.write('  Anuais: 5 (01/01) mais recentes\n')

        # Agrupar backups por tipo
        daily = []
        weekly = []
        monthly = []
        yearly = []

        for backup in self.metadata['backups']:
            dt = datetime.fromisoformat(backup['datetime'])
            label = self._date_label(dt)

            # Classificar
            if dt.weekday() == 6:  # Domingo
                weekly.append((label['weekly'], dt, backup))
            if dt.day == 1:
                monthly.append((label['monthly'], dt, backup))
            if dt.month == 1 and dt.day == 1:
                yearly.append((label['yearly'], dt, backup))
            daily.append((label['daily'], dt, backup))

        # Ordenar por data (mais recente primeiro)
        daily.sort(key=lambda x: x[1], reverse=True)
        weekly.sort(key=lambda x: x[1], reverse=True)
        monthly.sort(key=lambda x: x[1], reverse=True)
        yearly.sort(key=lambda x: x[1], reverse=True)

        # Determinar quais MANTER
        keep = set()
        for lst, limit, label in [
            (daily, 7, 'diário'),
            (weekly, 4, 'semanal'),
            (monthly, 12, 'mensal'),
            (yearly, 5, 'anual'),
        ]:
            for i, (lbl, dt, backup) in enumerate(lst):
                if i < limit:
                    keep.add(backup['timestamp'])
                    self.stdout.write(f'  ✓ MANTER [{label}] {dt.strftime("%Y-%m-%d")} ({backup["type"]})')
                else:
                    self.stdout.write(f'  ✗ REMOVER [{label}] {dt.strftime("%Y-%m-%d")} ({backup["type"]})')

        # Remover os que não estão em keep
        removed_count = 0
        freed_space = 0
        new_backups = []

        for backup in self.metadata['backups']:
            if backup['timestamp'] in keep:
                new_backups.append(backup)
            else:
                # Apagar arquivos físicos
                for f in backup['files']:
                    fp = Path(backup['directory']) / f
                    if fp.exists():
                        freed_space += fp.stat().st_size
                        fp.unlink()
                        removed_count += 1
                        self.stdout.write(f'    🗑  Removido: {fp.name}')

        self.metadata['backups'] = new_backups
        self._save_metadata()

        self.stdout.write(self.style.SUCCESS(f'\n✅ ROTAÇÃO CONCLUÍDA'))
        self.stdout.write(f'   Backups removidos: {removed_count} arquivos')
        self.stdout.write(f'   Espaço liberado: {freed_space / 1024 / 1024:.2f} MB')
        self.stdout.write(f'   Backups mantidos: {len(new_backups)}')

    # ============================================================
    # MAIN HANDLE
    # ============================================================
    def handle(self, *args, **options):
        if options['list']:
            self.handle_list(options)
        elif options['restore']:
            self.handle_restore(options)
        elif options['test_restore']:
            self.handle_test_restore(options)
        elif options['rotate']:
            self.handle_rotate(options)
        else:
            self.handle_backup(options)