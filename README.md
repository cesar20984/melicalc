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
