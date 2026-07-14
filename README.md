# FacturaPro

## Configuración de Supabase y OCR

### 1. Variables de entorno locales
Copia `.env.example` a `.env` y completa los valores reales:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
OPENAI_API_KEY=<tu-openai-api-key>
```

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` son necesarios para que la app client se conecte a Supabase.
- `OPENAI_API_KEY` solo se usa en la función `ocr-invoice` si quieres OCR real. Si no, la función usa un modo demo.

> No subas `.env` a GitHub. Ya está en `.gitignore`.

### 2. Crear el proyecto y la base de datos en Supabase

1. Crea un proyecto en https://app.supabase.com
2. Copia tu `Project URL` y tu `anon public` key en el archivo `.env`
3. Instala Supabase CLI si aún no lo tienes:

```bash
npm install -g supabase
```

4. Inicia sesión:

```bash
supabase login
```

5. En tu carpeta del proyecto ejecuta:

```bash
supabase init
```

Esto crea el archivo `supabase/config.toml` con el `project_ref`.

### 3. Crear tablas, bucket y políticas

El proyecto ya incluye estas migraciones:
- `supabase/migrations/20260709203515_001_initial_schema.sql`
- `supabase/migrations/20260709203944_002_storage_bucket.sql`

Para aplicar las migraciones usa:

```bash
supabase db push
```

Si no usas CLI, también puedes ejecutar esos SQL directamente en el editor SQL de Supabase.

### 4. Deploy de la función `ocr-invoice`

La función ya existe en:
- `supabase/functions/ocr-invoice/index.ts`

Para desplegarla:

```bash
supabase functions deploy ocr-invoice
```

### 5. Configurar secrets para la función

Si quieres OCR real con OpenAI, define el secret en Supabase:

```bash
supabase functions secrets set OPENAI_API_KEY="<tu-openai-api-key>"
```

O usa el panel de Supabase en la sección de Functions para agregar secretos.

### 6. Verificar la función

Prueba la función desde Supabase CLI o el panel de Functions.

Desde CLI:

```bash
supabase functions invoke ocr-invoice --body '{"image":"<base64>","type":"image/jpeg"}'
```

> Si `OPENAI_API_KEY` no está definido, la función devuelve un resultado demo.

### 7. Configurar Vercel / Render

Para desplegar en Vercel / Render, configura estas variables de entorno en el panel del deployment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL` (opcional para Render/backend)
- `SUPABASE_SERVICE_ROLE_KEY` (opcional para Render/backend)
- `OPENAI_API_KEY` (si quieres OCR real)

Para Vercel, el `build command` debe ser:

```bash
npm run build
```

El `publish directory` debe ser:

```bash
dist
```

### 8. Qué hace la función `ocr-invoice`

- Recibe `image` base64 y `type` MIME
- Si `OPENAI_API_KEY` existe, llama a OpenAI para extraer datos
- Si no existe, devuelve un resultado mock/demo
- La app consume esta función desde `src/components/InvoiceUpload.tsx`

### 9. Recomendación adicional

Si ya tienes el proyecto en Supabase, asegúrate de que el bucket `invoices` exista y sea público.

Puedes comprobarlo en `Storage > Buckets`.

---

## Nota
Si necesitas, te puedo ayudar a crear el `supabase/config.toml` con tu `project_ref` real y agregar pasos exactos para Vercel o Render.