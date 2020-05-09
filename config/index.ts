import nconf from 'nconf'
import path from 'path'

nconf
  .env()
  .file('conf', { file: 'env.json', dir: path.join(__dirname, '../etc/conf'), search: true })
  .file('secret', { file: 'secret.json', dir: path.join(__dirname, '../etc/secret'), search: true })
  .defaults({
    'TRACKER_TOPIC': '',
    'ENCRYPT_PASSWORD': '__default_encrypt_password__',
    'GCP_PROJECT_ID': 'reelevant-1366',
    'PORT': '8000',
    'LOG_LEVEL': 'info',
    'PUBSUB_BUFFER_SIZE': '500',
    'BOT_LIST': 'Googlebot,YandexMobileBot,YandexAccessibilityBot,Mappy,AdsBot-Google,SMTBot,AdsBot-Google-Mobile,Pinterestbot,AhrefsBot,Bingbot,Slurp,DuckDuckBot,Baiduspider'
  })

export = nconf
