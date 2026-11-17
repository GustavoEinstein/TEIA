"""
Management command para limpeza automática de logs antigos.
Conforme Art. 15 Marco Civil da Internet (6 meses) e Política de Retenção T.E.I.A.

Uso:
    python manage.py cleanup_old_logs           # Dry-run (padrão)
    python manage.py cleanup_old_logs --execute # Executa de fato
    python manage.py cleanup_old_logs --days 180 # Personaliza retenção (padrão 180)
"""
import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Remove logs de acesso antigos (padrão: > 180 dias / 6 meses)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--execute',
            action='store_true',
            help='Executa a eliminação (padrão: dry-run apenas mostra o que seria deletado)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=180,
            help='Dias de retenção (padrão: 180 = 6 meses per Art. 15 MCI)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10000,
            help='Tamanho do lote para DELETE em chunks (padrão: 10000)',
        )

    def handle(self, *args, **options):
        execute = options['execute']
        retention_days = options['days']
        batch_size = options['batch_size']
        cutoff_date = timezone.now() - timedelta(days=retention_days)

        self.stdout.write(self.style.NOTICE(
            f'=== LIMPEZA LOGS ACESSO ==='))
        self.stdout.write(f'Data corte: {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'Retenção: {retention_days} dias')
        self.stdout.write(f'Modo: {"EXECUÇÃO REAL" if execute else "DRY-RUN (simulação)"}')
        self.stdout.write(f'Batch size: {batch_size}')

        # Tabelas de log conhecidas no projeto
        log_tables = [
            # Django built-in
            ('django_admin_log', 'action_time'),
            # App específico (se existirem)
            ('kipo_playground_acessolog', 'data_acesso'),  # hipotética
            ('kipo_playground_errolog', 'data_erro'),      # hipotética
            ('kipo_playground_auditoria', 'criado_em'),    # auditoria admin (retenção 2 anos - não tocar aqui)
        ]

        total_deleted = 0

        with connection.cursor() as cursor:
            for table, date_column in log_tables:
                # Verificar se tabela existe
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = %s
                    )
                """, [table])
                exists = cursor.fetchone()[0]

                if not exists:
                    self.stdout.write(f'  ⊘ Tabela {table} não existe — pulando')
                    continue

                # Contar registros a deletar
                cursor.execute(
                    f'SELECT COUNT(*) FROM {table} WHERE {date_column} < %s',
                    [cutoff_date]
                )
                count = cursor.fetchone()[0]

                if count == 0:
                    self.stdout.write(f'  ✓ {table}: 0 registros antigos')
                    continue

                self.stdout.write(f'  → {table}: {count} registros antigos (>{retention_days} dias)')

                if execute:
                    # Deletar em batches para evitar lock longo
                    deleted = 0
                    while deleted < count:
                        cursor.execute(
                            f'DELETE FROM {table} WHERE {date_column} < %s LIMIT %s',
                            [cutoff_date, batch_size]
                        )
                        batch_deleted = cursor.rowcount
                        deleted += batch_deleted
                        if batch_deleted == 0:
                            break

                    self.stdout.write(self.style.SUCCESS(f'     ✓ DELETADOS: {deleted} registros'))
                    total_deleted += deleted

                    # Log de auditoria da limpeza
                    cursor.execute("""
                        INSERT INTO kipo_playground_auditoria (acao, objeto, detalhes, usuario_id, ip, criado_em)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, [
                        'CLEANUP_LOGS',
                        table,
                        f'Limpeza automática: {deleted} registros >{retention_days} dias removidos',
                        None,  # sistema
                        '127.0.0.1',
                        timezone.now()
                    ])
                else:
                    self.stdout.write(f'     [DRY-RUN] Seriam deletados: {count}')

        # Limpeza de arquivos de log físicos (opcional - requer config LOG_DIR)
        self._cleanup_physical_logs(retention_days, execute)

        if execute:
            self.stdout.write(self.style.SUCCESS(f'\n✓ CONCLUÍDO: {total_deleted} registros removidos no total'))
            logger.info(f'Cleanup logs executado: {total_deleted} registros removidos (>{retention_days} dias)')
        else:
            self.stdout.write(self.style.WARNING('\n⚠ DRY-RUN concluído. Use --execute para efetivar.'))

    def _cleanup_physical_logs(self, retention_days, execute):
        """Limpa arquivos .log físicos em /var/log/teia/ ou similar"""
        import os
        import glob
        from datetime import datetime

        log_dirs = [
            '/var/log/teia/',
            '/home/teia/TEIA/backend/logs/',
            '/var/log/nginx/',
        ]

        cutoff_ts = (timezone.now() - timedelta(days=retention_days)).timestamp()

        for log_dir in log_dirs:
            if not os.path.isdir(log_dir):
                continue

            self.stdout.write(f'\n  📁 Verificando logs físicos em: {log_dir}')
            for log_file in glob.glob(os.path.join(log_dir, '*.log*')):
                try:
                    mtime = os.path.getmtime(log_file)
                    if mtime < cutoff_ts:
                        size = os.path.getsize(log_file)
                        self.stdout.write(f'     → {os.path.basename(log_file)}: {size} bytes, modificado em {datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")}')
                        if execute:
                            os.remove(log_file)
                            self.stdout.write(f'        ✓ REMOVIDO')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'     ✗ Erro em {log_file}: {e}'))