# MeliCalc

Calculadora de precios para Mercado Libre Chile.

## Deploy en Vercel con Neon

1. Conecta este repositorio en Vercel.
2. Crea o conecta una base de datos Neon.
3. Agrega esta variable de entorno en Vercel:

```txt
DATABASE_URL=postgres://...
```

La app crea automaticamente estas tablas al primer uso:

- `melicalc_settings`
- `melicalc_calculations`

## Desarrollo local

```bash
npm install
npm run check
```

Para usar la base de datos en local, crea `.env.local` con `DATABASE_URL` y ejecuta:

```bash
npm start
```

Si abres `index.html` directamente sin servidor, la app usa IndexedDB local como respaldo.

## API de calculo

La app expone un endpoint para llamarlo desde un addon de Chrome u otro cliente:

```txt
GET /api/calculate
POST /api/calculate
```

Ejemplo GET:

```txt
/api/calculate?productGross=29000&includeShipping=true&shippingGross=3500&packagingCost=150&profitPercent=40&mlRate=19
```

Ejemplo POST:

```json
{
  "productGross": 29000,
  "includeShipping": true,
  "shippingGross": 3500,
  "packagingCost": 150,
  "marginMode": "percent",
  "profitPercent": 40,
  "mlRate": 19
}
```

Para calcular desde precio final:

```json
{
  "productGross": 29000,
  "includeShipping": true,
  "shippingGross": 3500,
  "packagingCost": 150,
  "marginMode": "price",
  "manualFinalPrice": 56990,
  "mlRate": 19
}
```

El endpoint tiene CORS abierto para que pueda llamarse desde una extension de Chrome.

## Extension Chrome

La carpeta `extension/` contiene un addon Manifest V3.

Para instalarlo en modo desarrollo:

1. Abre Chrome.
2. Ve a `chrome://extensions`.
3. Activa `Modo desarrollador`.
4. Click en `Cargar descomprimida`.
5. Selecciona la carpeta `extension`.

El addon puede:

- Detectar si la pestana actual es Alibaba o AliExpress.
- Extraer precio, dimensiones y peso con OpenAI usando salida JSON estructurada.
- Calcular unidades por metro cubico, envio por barco y envio por avion.
- Abrir `https://melicalc-xi.vercel.app/` con los datos precargados.

Configura dentro del popup:

- OpenAI API key.
- Modelo OpenAI. El valor inicial es `gpt-5.2`; si tu cuenta tiene otro modelo, cambialo ahi.
- Precio del m3 por barco.
- Ad valorem, manejo y tarifas por kg para DHL/UPS/FedEx.

Nota: DHL/UPS/FedEx quedan como tarifas configurables por kg. Para consultar APIs oficiales reales de cada courier faltan sus credenciales y contratos de API.
