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
- Mantener la cuenta en curso aunque se cierre el popup del addon.
- Calcular unidades por metro cubico, envio por barco y envio por avion.
- Mostrar costo unitario puesto en Chile por barco y por avion.
- Abrir `https://melicalc-xi.vercel.app/` con el costo unitario puesto en Chile como precio del producto, sin tocar el envio de MeliCalc.

Configura dentro del popup:

- OpenAI API key.
- Modelo OpenAI. El valor inicial es `gpt-5.2`; si tu cuenta tiene otro modelo, cambialo ahi.
- Precio del m3 por barco en USD.
- Manejo UPS en USD calculado automaticamente por tramo FOB declarado.
- Tarifas por kg en USD para DHL/UPS/FedEx.
- Ad valorem.
- Dolar observado USD a CLP, obtenido desde `https://mindicador.cl/api/dolar` y editable manualmente si la API falla.

Tabla de manejo UPS usada:

- US$0 a 30: US$0
- US$30,01 a 50: US$11,75 + IVA
- US$50,01 a 70: US$21,50 + IVA
- US$70,01 a 100: US$29,25 + IVA
- US$100,01 a 200: US$36,50 + IVA
- US$200,01 a 400: US$54,45 + IVA
- US$400,01 a 700: US$72,45 + IVA
- US$700,01 a 1.000: US$81,45 + IVA
- US$1.000,01 a 3.000: US$168,35 + IVA

Nota: DHL/UPS/FedEx quedan como tarifas configurables por kg. Para consultar APIs oficiales reales de cada courier faltan sus credenciales y contratos de API.

Flujo actual:

- Alibaba: calcula costo unitario puesto en Chile por barco o avion y abre MeliCalc con ese valor como producto.
- AliExpress: usa precio del producto + 19% IVA, porque el envio se considera incluido, y abre MeliCalc con envio apagado.
