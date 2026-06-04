# Lagerflyt

Mobilvennlig webapp for varetelling og lageroversikt med to hovedflater:

- Ansattflate for rask telling fra mobil
- Admin-dashboard for lagerstatus, lagerverdi, produktregister og historikk

## Stack

- Next.js 16 + App Router
- TypeScript
- Tailwind CSS 3
- SQLite via Node `node:sqlite`
- SQLite for lokal utvikling
- Enkel cookie-basert autentisering med roller (`EMPLOYEE`, `ADMIN`)

## Funksjoner i første versjon

- Innlogging for ansatt og admin
- Mobiltilpasset varetelling med søk, kategori og varetype-filter
- Lagring av telling med vare, antall, tidspunkt og bruker
- Admin-dashboard med:
  - total beholdning
  - verdi per vare
  - total lagerverdi
  - tydelig markering av lav beholdning
  - søk og filtrering
  - historikk over siste tellinger
- Oppretting og redigering av varer
- Excel-import med preview, bekreftelse og importhistorikk
- Excel-eksport av lagerstatus, tellehistorikk, innkjøpsliste og leverandøroversikt
- Lav-beholdning-rapport med forslag til bestillingsantall og leverandørgruppering
- Leverandøradministrasjon med aktiv/inaktiv-status og trygg sletting
- Brukeradministrasjon for ansatte og admin
- Kategoriadministrasjon
- Seed-data for emballasje, mat og forbruksmateriell

## Datamodell

Tabellene og modellreferansen dekker:

- `users`
- `products`
- `categories`
- `inventory_counts`
- `suppliers`

`products.currentStock` brukes for rask lageroversikt, mens `inventory_counts` lagrer komplett tellehistorikk. En `prisma/schema.prisma` følger prosjektet som modellreferanse og dokumentasjon av strukturen.

## Kjør lokalt

1. Installer avhengigheter:

```bash
source "$HOME/.bashrc"
pnpm install
```

2. Opprett miljøvariabler:

```bash
cp .env.example .env
```

3. Opprett database og seed eksempeldata:

```bash
pnpm db:push
pnpm db:seed
```

4. Start appen:

```bash
pnpm dev
```

Åpne [http://localhost:3000](http://localhost:3000).

## Produksjon / publisering

Appen er nå klargjort for publisering med:

- `SESSION_SECRET` som påkrevd i produksjon
- `DATABASE_URL` som brukes både av appen og databaseskriptet
- `output: "standalone"` for Next.js
- Dockerfile for container-deploy
- helse-endepunkt på `/api/health`

### Miljøvariabler i produksjon

Minst disse må settes:

```bash
DATABASE_URL="file:/data/dev.db"
SESSION_SECRET="sett-en-lang-tilfeldig-hemmelighet"
NODE_ENV="production"
```

### Starte i produksjonsmodus lokalt

```bash
pnpm build
pnpm start:prod
```

### Docker

Bygg image:

```bash
docker build -t lagerflyt .
```

Kjør container med persistert SQLite-fil:

```bash
docker run -p 3000:3000 \
  -e SESSION_SECRET="sett-en-lang-hemmelighet" \
  -e DATABASE_URL="file:/data/dev.db" \
  -v $(pwd)/data:/data \
  lagerflyt
```

Deretter kan du sjekke helse på:

```bash
curl http://localhost:3000/api/health
```

### Anbefalt hosting

Denne appen passer best på en plattform som støtter:

- Docker-deploy
- persistent disk/volume for SQLite
- egne miljøvariabler

Eksempler:

- Railway
- Render
- Fly.io

Hvis du vil bruke Vercel i produksjon, bør databasen flyttes fra lokal SQLite til en ekstern database som PostgreSQL.

## Railway

Prosjektet er nå klargjort for Railway med:

- `Dockerfile` i rotmappen
- `railway.toml` med healthcheck på `/api/health`
- produksjonsstart som oppretter SQLite-skjema ved oppstart

### Slik deployer du til Railway

1. Opprett en ny Railway-prosjekt og koble til GitHub-repoet.
2. Railway vil automatisk bruke `Dockerfile` i rotmappen.
3. Legg til en `Volume` på samme service.
4. Sett mount path til `/data`.
5. Legg inn disse variablene på servicen:

```bash
DATABASE_URL="file:/data/dev.db"
SESSION_SECRET="sett-en-lang-tilfeldig-hemmelighet"
NODE_ENV="production"
```

6. Deploy servicen.

### Viktig om SQLite på Railway

Railway dokumenterer at volumes bare er tilgjengelige når containeren starter, ikke under build/pre-deploy. Derfor opprettes databasen i startflyten, ikke i buildsteget. Dette er grunnen til at appen bruker `python3 scripts/setup_db.py` ved produksjonsstart.

### Første oppsett av data

Hvis du vil fylle løsningen med eksempeldata etter første deploy, kjør seed én gang mot Railway-miljøet fra CLI:

```bash
railway run pnpm db:seed
```

Dette forutsetter at du har Railway CLI installert og er logget inn.

## Testbrukere

- Admin
  - E-post: `admin@lagerflyt.no`
  - Passord: `Admin123!`
- Ansatt
  - E-post: `ansatt@lagerflyt.no`
  - Passord: `Ansatt123!`

## Videre utvikling

Naturlige neste steg:

- bytte fra SQLite til PostgreSQL i produksjon
- støtte flere lagerlokasjoner
- legge til revisjonsspor for endringer på produkter og leverandører
- utvide med innkjøpsordre og leverandørbestillinger
- legge til passordbytte og eventuelt e-postinvitasjoner for nye brukere
