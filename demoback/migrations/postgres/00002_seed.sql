-- +goose Up

-- users
INSERT INTO users (id, login, password, first_name, last_name, position, email, department) VALUES
('user-admin',   'admin',            'Admin123',    'Александр', 'Администраторов', 'Главный администратор платформы', 'admin@corp.internal',          'Платформенная инфраструктура'),
('user-ivan',    'ivan.petrov',      'Petrov123',   'Иван',      'Петров',          'Старший инженер по разработке',   'ivan.petrov@corp.internal',    'Команда интеграций'),
('user-maria',   'maria.sidorova',   'Sidorova123', 'Мария',     'Сидорова',        'Тимлид аналитической платформы', 'maria.sidorova@corp.internal', 'Аналитика и BI'),
('user-dmitry',  'dmitry.kozlov',    'Kozlov123',   'Дмитрий',   'Козлов',          'DevOps-инженер',                  'dmitry.kozlov@corp.internal',  'Эксплуатация и мониторинг'),
('user-olga',    'olga.novikova',    'Novikova123', 'Ольга',     'Новикова',        'Архитектор безопасности',         'olga.novikova@corp.internal',  'Информационная безопасность'),
('user-aleksey', 'aleksey.sokolov',  'Sokolov123',  'Алексей',   'Соколов',         'Продуктовый инженер',             'aleksey.sokolov@corp.internal','Каталог товаров'),
('user-elena',   'elena.morozova',   'Morozova123', 'Елена',     'Морозова',        'Инженер по уведомлениям',         'elena.morozova@corp.internal', 'Коммуникационные сервисы'),
('user-sergey',  'sergey.volkov',    'Volkov123',   'Сергей',    'Волков',          'Системный аналитик',              'sergey.volkov@corp.internal',  'Системный анализ');

-- namespaces
INSERT INTO namespaces (id, name, display_name, description) VALUES
('ns-payments',      'payments',      'Платёжные системы',        'Бизнес-вертикаль обработки платежей: приём, процессинг, выплаты, антифрод и сверки.'),
('ns-analytics',     'analytics',     'Аналитика и отчётность',   'Платформа сбора, хранения и визуализации бизнес-данных, BI-инструменты и автоматические отчёты.'),
('ns-auth',          'auth',          'Авторизация и безопасность','Управление идентичностью, единый вход (SSO), OAuth2/SAML, хранение сессий и токенов.'),
('ns-catalog',       'catalog',       'Каталог товаров',           'Управление продуктовым каталогом: структура категорий, карточки товаров, поиск и фасетная фильтрация.'),
('ns-notifications', 'notifications', 'Уведомления',               'Мультиканальная доставка уведомлений: e-mail, push, SMS. Управление шаблонами и провайдерами.');

-- projects
INSERT INTO projects (id, namespace_id, parent_project_id, name, display_name, description) VALUES
('prj-payment-gateway',  'ns-payments',      NULL,                    'payment-gateway',  'Payment Gateway',  'Единая точка входа для обработки всех платёжных транзакций.'),
('prj-fraud-detection',  'ns-payments',      'prj-payment-gateway',   'fraud-detection',  'Fraud Detection',  'Подсистема антифрода: скоринг транзакций в реальном времени и управление блок-листами.'),
('prj-settlement',       'ns-payments',      'prj-payment-gateway',   'settlement',       'Settlement',       'Сверка и взаиморасчёты с платёжными провайдерами.'),
('prj-bi-platform',      'ns-analytics',     NULL,                    'bi-platform',      'BI Platform',      'Основная BI-платформа: ETL-конвейеры, дашборды и хранилище данных.'),
('prj-data-warehouse',   'ns-analytics',     'prj-bi-platform',       'data-warehouse',   'Data Warehouse',   'Корпоративное хранилище данных: схемы, коннекторы, оркестрация.'),
('prj-reporting',        'ns-analytics',     NULL,                    'reporting',        'Reporting',        'Генерация и доставка плановых и ad-hoc отчётов.'),
('prj-identity-provider','ns-auth',          NULL,                    'identity-provider','Identity Provider','Реестр пользователей, управление паролями и токенами.'),
('prj-sso',              'ns-auth',          NULL,                    'sso',              'SSO',              'Единый вход: поддержка SAML, OAuth2 и управление сессиями.'),
('prj-product-catalog',  'ns-catalog',       NULL,                    'product-catalog',  'Product Catalog',  'Управление карточками товаров, категориями и атрибутами.'),
('prj-search-engine',    'ns-catalog',       'prj-product-catalog',   'search-engine',    'Search Engine',    'Полнотекстовый и фасетный поиск по каталогу.'),
('prj-email-service',    'ns-notifications', NULL,                    'email-service',    'Email Service',    'Отправка транзакционных и маркетинговых e-mail сообщений.'),
('prj-push-service',     'ns-notifications', NULL,                    'push-service',     'Push Service',     'Отправка push-уведомлений в мобильные приложения.'),
('prj-sms-gateway',      'ns-notifications', NULL,                    'sms-gateway',      'SMS Gateway',      'Маршрутизация SMS через внешних операторов.');

-- services
INSERT INTO services (id, project_id, name, display_name, description, config) VALUES
('svc-api-gateway',         'prj-payment-gateway',   'api-gateway',          'API Gateway',          'Единая точка входа для всех внешних запросов к платёжному домену.',
 '{"host":"0.0.0.0","port":8080,"timeout_ms":5000,"rate_limit":{"rps":10000,"burst":2000},"upstreams":["payment-processor:8081","webhook-handler:8082"],"tls":{"enabled":true,"cert_path":"/etc/certs/api-gateway.crt"},"logging":{"level":"INFO","format":"json"},"cors":{"allowed_origins":["https://pay.corp.internal"],"max_age":3600}}'),
('svc-payment-processor',   'prj-payment-gateway',   'payment-processor',    'Payment Processor',    'Ядро обработки платёжных транзакций.',
 '{"database":{"host":"pg-payments.internal","port":5432,"pool_size":20,"ssl":true},"providers":["sberbank","tinkoff","vtb"],"retry_policy":{"max_attempts":3,"backoff_ms":500,"jitter":true},"feature_flags":{"new_3ds":true,"installments":false,"sbp_enabled":true},"queue":{"broker":"kafka","topic":"payments.transactions","group_id":"processor-v2"}}'),
('svc-webhook-handler',     'prj-payment-gateway',   'webhook-handler',      'Webhook Handler',      'Приём и обработка входящих webhook-уведомлений от платёжных провайдеров.',
 '{"listen_port":8082,"secret_key_env":"WEBHOOK_SECRET","providers":{"sberbank":{"path":"/webhook/sberbank","validate_signature":true},"tinkoff":{"path":"/webhook/tinkoff","validate_signature":true},"vtb":{"path":"/webhook/vtb","validate_signature":false}},"retry":{"max_attempts":5,"delay_ms":1000},"dead_letter_queue":"payments.webhook.dlq"}'),
('svc-fraud-rules-engine',  'prj-fraud-detection',   'fraud-rules-engine',   'Fraud Rules Engine',   'Движок правил антифрода.',
 '{"rules_reload_interval_sec":60,"scoring_threshold":0.75,"rules":[{"id":"r001","name":"high_amount","threshold":500000,"action":"flag"},{"id":"r002","name":"foreign_ip","countries":["NG","KP","IR"],"action":"block"},{"id":"r003","name":"velocity_check","max_txn_per_hour":10,"action":"challenge"}],"ml_model":{"enabled":true,"endpoint":"http://ml-scoring.internal/predict","timeout_ms":200}}'),
('svc-transaction-scorer',  'prj-fraud-detection',   'transaction-scorer',   'Transaction Scorer',   'ML-сервис скоринга транзакций.',
 '{"model_version":"v3.2.1","feature_store":{"host":"redis-features.internal","port":6379,"db":2},"inference":{"batch_size":64,"timeout_ms":150},"monitoring":{"drift_threshold":0.05,"alert_channel":"fraud-alerts"}}'),
('svc-blocklist-manager',   'prj-fraud-detection',   'blocklist-manager',    'Blocklist Manager',    'Управление списками блокировки.',
 '{"storage":{"backend":"redis","host":"redis-blocklist.internal","ttl_days":90},"sync":{"enabled":true,"source":"https://feeds.frauddb.net/v2","interval_min":30},"categories":["card","account","device_fingerprint","ip_range","email"]}'),
('svc-settlement-engine',   'prj-settlement',        'settlement-engine',    'Settlement Engine',    'Движок расчётов.',
 '{"schedule":{"cron":"0 3 * * *","timezone":"Europe/Moscow"},"banks":["sberbank","tinkoff","vtb","alfabank"],"format":"ISO20022","database":{"host":"pg-settlement.internal","port":5432,"pool_size":10},"notifications":{"on_success":"ops-team@corp.internal","on_failure":"oncall@corp.internal"}}'),
('svc-reconciliation',      'prj-settlement',        'reconciliation',       'Reconciliation',       'Сверка внутренних данных о транзакциях с реестрами банков-партнёров.',
 '{"schedule":{"cron":"30 4 * * *","timezone":"Europe/Moscow"},"tolerance_kopecks":1,"report_bucket":"s3://corp-finance-reports/reconciliation","alert_threshold_pct":0.01}'),
('svc-etl-pipeline',        'prj-bi-platform',       'etl-pipeline',         'ETL Pipeline',         'Конвейер ETL из операционных систем в хранилище.',
 '{"orchestrator":"airflow","dag_folder":"/opt/airflow/dags/etl","sources":["pg-payments","pg-orders","pg-users","clickhouse-events"],"target":{"host":"pg-dw.internal","schema":"staging"},"schedule":"0 */2 * * *","slack_alerts":{"channel":"#data-alerts","on_failure":true,"on_sla_miss":true}}'),
('svc-dashboard-renderer',  'prj-bi-platform',       'dashboard-renderer',   'Dashboard Renderer',   'Сервис рендеринга дашбордов на основе Superset.',
 '{"superset_url":"https://bi.corp.internal","cache":{"backend":"redis","host":"redis-bi.internal","ttl_sec":300},"embed_key_ttl_sec":3600,"feature_flags":{"alerts_reports":true,"thumbnails":true,"explore_form_data_cache":true}}'),
('svc-dw-connector',        'prj-data-warehouse',    'dw-connector',         'DW Connector',         'Набор коннекторов для загрузки данных в хранилище.',
 '{"connections":{"payments":{"driver":"postgresql","host":"pg-payments.internal","database":"payments","user":"dw_reader"},"orders":{"driver":"postgresql","host":"pg-orders.internal","database":"orders","user":"dw_reader"},"events":{"driver":"clickhouse","host":"ch-events.internal","database":"events","user":"dw_reader"}},"batch_size":10000,"parallelism":4}'),
('svc-schema-manager',      'prj-data-warehouse',    'schema-manager',       'Schema Manager',       'Управление схемами и миграциями в хранилище данных.',
 '{"database":{"host":"pg-dw.internal","port":5432,"database":"datawarehouse"},"migrations_dir":"/opt/schema-manager/migrations","auto_apply":false,"review_required":true,"slack_notifications":{"channel":"#dw-schema-changes"}}'),
('svc-report-generator',    'prj-reporting',         'report-generator',     'Report Generator',     'Генерация бизнес-отчётов по шаблонам.',
 '{"templates_path":"/opt/reports/templates","output_bucket":"s3://corp-reports/generated","formats":["xlsx","pdf","html"],"max_rows":1000000,"timeout_sec":300}'),
('svc-scheduled-reports',   'prj-reporting',         'scheduled-reports',    'Scheduled Reports',    'Планировщик автоматической генерации и доставки отчётов.',
 '{"jobs":[{"id":"daily-payments","cron":"0 8 * * *","template":"daily_payments","recipients":["finance@corp.internal"]},{"id":"weekly-kpi","cron":"0 9 * * 1","template":"weekly_kpi","recipients":["ceo@corp.internal","cfo@corp.internal"]},{"id":"monthly-revenue","cron":"0 10 1 * *","template":"monthly_revenue","recipients":["finance@corp.internal"]}],"delivery":{"smtp_host":"smtp.corp.internal","from":"reports@corp.internal"}}'),
('svc-pdf-exporter',        'prj-reporting',         'pdf-exporter',         'PDF Exporter',         'Конвертация HTML-отчётов в PDF через headless Chrome.',
 '{"chrome_path":"/usr/bin/chromium","concurrency":4,"page_timeout_ms":30000,"pdf_options":{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"15mm","right":"15mm"}},"watermark":{"enabled":false,"text":"CONFIDENTIAL"}}'),
('svc-user-registry',       'prj-identity-provider', 'user-registry',        'User Registry',        'Централизованный реестр пользователей.',
 '{"database":{"host":"pg-auth.internal","port":5432,"database":"users","pool_size":15},"cache":{"backend":"redis","host":"redis-auth.internal","ttl_sec":600},"pagination":{"default_limit":50,"max_limit":500},"search":{"enabled":true,"fields":["email","firstName","lastName","department"]},"events":{"broker":"kafka","topic":"auth.user.events"}}'),
('svc-password-service',    'prj-identity-provider', 'password-service',     'Password Service',     'Управление паролями: хеширование, политики, история и сброс.',
 '{"hashing":{"algorithm":"argon2id","memory_kb":65536,"iterations":3,"parallelism":4},"policy":{"min_length":10,"require_upper":true,"require_digits":true,"require_special":true,"history_depth":10},"reset_token":{"ttl_minutes":30,"delivery":"email"},"lockout":{"max_attempts":5,"lockout_duration_min":15}}'),
('svc-token-manager',       'prj-identity-provider', 'token-manager',        'Token Manager',        'Выпуск, валидация и отзыв JWT/opaque токенов.',
 '{"access_token":{"ttl_sec":900,"algorithm":"RS256","issuer":"https://auth.corp.internal"},"refresh_token":{"ttl_days":30,"rotation":true,"family_invalidation":true},"jwks_uri":"https://auth.corp.internal/.well-known/jwks.json","revocation_store":{"backend":"redis","host":"redis-auth.internal","db":1}}'),
('svc-saml-provider',       'prj-sso',               'saml-provider',        'SAML Provider',        'IdP-роль для SAML 2.0.',
 '{"entity_id":"https://sso.corp.internal/saml/metadata","sso_url":"https://sso.corp.internal/saml/sso","slo_url":"https://sso.corp.internal/saml/slo","cert_path":"/etc/certs/saml-idp.crt","key_path":"/etc/certs/saml-idp.key","session_ttl_h":8,"sp_list":["jira","confluence","gitlab","grafana"]}'),
('svc-oauth2-server',       'prj-sso',               'oauth2-server',        'OAuth2 Server',        'Authorization Server по OAuth 2.1.',
 '{"issuer":"https://auth.corp.internal","authorization_endpoint":"/oauth/authorize","token_endpoint":"/oauth/token","scopes":["openid","profile","email","api:read","api:write","admin"],"pkce_required":true,"clients_config":"dynamic","introspection_enabled":true}'),
('svc-session-manager',     'prj-sso',               'session-manager',      'Session Manager',      'Управление пользовательскими сессиями.',
 '{"store":{"backend":"redis","host":"redis-sessions.internal","db":0,"cluster":false},"session_ttl_min":480,"idle_ttl_min":60,"max_sessions_per_user":5,"geo_restriction":{"enabled":false,"allowed_countries":[]}}'),
('svc-product-api',         'prj-product-catalog',   'product-api',          'Product API',          'REST API для управления карточками товаров.',
 '{"database":{"host":"pg-catalog.internal","port":5432,"database":"catalog","pool_size":20},"cache":{"backend":"redis","host":"redis-catalog.internal","ttl_sec":120},"image_storage":{"provider":"s3","bucket":"corp-product-images","cdn":"https://cdn.corp.internal"},"pagination":{"default_limit":20,"max_limit":200}}'),
('svc-category-manager',    'prj-product-catalog',   'category-manager',     'Category Manager',     'Управление деревом категорий и атрибутных моделей.',
 '{"max_depth":6,"cache":{"backend":"redis","host":"redis-catalog.internal","ttl_sec":3600},"slug_strategy":"auto","attribute_types":["string","number","boolean","enum","multiselect"]}'),
('svc-search-api',          'prj-search-engine',     'search-api',           'Search API',           'Полнотекстовый и фасетный поиск по каталогу товаров.',
 '{"elasticsearch":{"host":"es-catalog.internal","port":9200,"index":"products","replicas":1,"shards":3},"default_size":20,"highlight":true,"facets":["category","brand","price_range","rating"],"suggest":{"enabled":true,"min_chars":2}}'),
('svc-indexer',             'prj-search-engine',     'indexer',              'Indexer',              'Индексация и обновление данных в поисковом движке.',
 '{"source":{"broker":"kafka","topic":"catalog.product.events","group_id":"search-indexer"},"batch_size":500,"flush_interval_ms":2000,"retry":{"max_attempts":3,"backoff_ms":1000}}'),
('svc-smtp-relay',          'prj-email-service',     'smtp-relay',           'SMTP Relay',           'SMTP-relay с поддержкой нескольких провайдеров.',
 '{"providers":[{"name":"mailgun","priority":1,"api_key_env":"MAILGUN_API_KEY","domain":"mail.corp.internal"},{"name":"ses","priority":2,"region":"eu-central-1"}],"max_retries":3,"rate_limit_per_min":1000,"dkim":{"enabled":true,"selector":"corp2024"}}'),
('svc-template-engine',     'prj-email-service',     'template-engine',      'Template Engine',      'Рендеринг email-шаблонов с персонализацией.',
 '{"templates_backend":"s3","s3_bucket":"corp-email-templates","cache_ttl_sec":300,"locales":["ru","en"],"default_locale":"ru","mjml_enabled":true}'),
('svc-push-gateway',        'prj-push-service',      'push-gateway',         'Push Gateway',         'Маршрутизация push-уведомлений через FCM и APNs.',
 '{"fcm":{"api_key_env":"FCM_SERVER_KEY","batch_size":500},"apns":{"cert_path":"/etc/certs/apns.p12","sandbox":false,"batch_size":100},"retry":{"max_attempts":3,"delay_ms":500},"rate_limit":{"rps":5000}}'),
('svc-device-registry',     'prj-push-service',      'device-registry',      'Device Registry',      'Реестр устройств и push-токенов пользователей.',
 '{"database":{"host":"pg-notifications.internal","port":5432,"database":"devices","pool_size":10},"token_ttl_days":90,"dedup_strategy":"last_seen","platforms":["android","ios","web"]}'),
('svc-sms-router',          'prj-sms-gateway',       'sms-router',           'SMS Router',           'Маршрутизация SMS-сообщений через внешних операторов.',
 '{"operators":[{"name":"mts","priority":1,"api_url":"https://api.mts.ru/sms","api_key_env":"MTS_API_KEY"},{"name":"megafon","priority":2,"api_url":"https://api.megafon.ru/send","api_key_env":"MEGAFON_API_KEY"},{"name":"beeline","priority":3,"api_url":"https://api.beeline.ru/sms","api_key_env":"BEELINE_API_KEY"}],"max_length":160,"encoding":"utf-8","retry":{"max_attempts":2,"delay_ms":2000}}'),
('svc-sms-templates',       'prj-sms-gateway',       'sms-templates',        'SMS Templates',        'Управление шаблонами SMS и переменными подстановки.',
 '{"storage":"database","database":{"host":"pg-notifications.internal","port":5432},"max_template_length":160,"variables_syntax":"{{var}}","locales":["ru","en"],"approval_required":true}');

-- role assignments
INSERT INTO role_assignments (user_id, entity_type, entity_id, role) VALUES
('user-admin',   'namespace', 'ns-payments',       'responsible'),
('user-admin',   'namespace', 'ns-analytics',      'responsible'),
('user-admin',   'namespace', 'ns-auth',           'responsible'),
('user-admin',   'namespace', 'ns-catalog',        'responsible'),
('user-admin',   'namespace', 'ns-notifications',  'responsible'),

('user-ivan',    'namespace', 'ns-payments',       'read'),
('user-ivan',    'project',   'prj-bi-platform',   'edit'),
('user-ivan',    'service',   'svc-user-registry', 'edit'),
('user-ivan',    'project',   'prj-email-service', 'read'),
('user-ivan',    'service',   'svc-search-api',    'responsible'),

('user-maria',   'namespace', 'ns-analytics',      'responsible'),
('user-maria',   'project',   'prj-email-service', 'read'),

('user-dmitry',  'namespace', 'ns-payments',       'read'),
('user-dmitry',  'namespace', 'ns-notifications',  'read'),

('user-olga',    'namespace', 'ns-auth',           'responsible'),
('user-olga',    'project',   'prj-product-catalog','edit'),

('user-aleksey', 'namespace', 'ns-catalog',        'responsible'),
('user-aleksey', 'project',   'prj-bi-platform',   'read'),

('user-elena',   'namespace', 'ns-notifications',  'responsible'),
('user-elena',   'project',   'prj-identity-provider','edit'),

('user-sergey',  'namespace', 'ns-payments',       'read'),
('user-sergey',  'namespace', 'ns-analytics',      'read'),
('user-sergey',  'namespace', 'ns-auth',           'read'),
('user-sergey',  'namespace', 'ns-catalog',        'read'),
('user-sergey',  'namespace', 'ns-notifications',  'read');

-- +goose Down
DELETE FROM role_assignments;
DELETE FROM services;
DELETE FROM projects;
DELETE FROM namespaces;
DELETE FROM users;
