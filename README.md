
# Hur man kör lösningen

## Förutsättningar

- Node.js (>= 18)
- Docker & Docker Compose
- Ett Resend-konto (för e-post)
- API-nycklar till OpenAI och Pexels

## 1. Klona repo och installera

```bash
git clone 
npm install
```

## 2. Konfigurera miljövariabler

Skapa en `.env.local` file 

```env
DATABASE_URL=postgres://user:password@db:5432/booking
RESEND_API_KEY=...
OPENAI_API_KEY=...
PEXELS_API_KEY=...
```

**Obs:** `DATABASE_URL` måste vara samma för både app och worker eftersom PgBoss använder databasen som kö.

## 3. Starta via Docker (rekommenderat)

```bash
docker compose up --build
```

Det startar:

- **app** – Next.js-applikationen på http://localhost:3000  
- **email-worker** – bakgrundsworker som skickar mejl  
- **db** – PostgreSQL

Öppna http://localhost:3000 i webbläsaren och fyll i bokningsformuläret.

# Förklaring av teknik

## Next.js (frontend + backend i samma projekt)
- Ger ett enkelt sätt att bygga UI och API-endpoints i samma repo.  
- `app/api/.../route.ts` gör backend-delen väldigt tydlig.  
- Modern stack med TypeScript, bra utvecklarupplevelse och bra för testprojekt.

## PostgreSQL som databas
- Stabil och relationsbaserad.  
- Passar perfekt för data med relationer (kund → bokningar → mejlloggar).  
- Stöd för constraints, foreign keys, indexes och enums.

## Connection Pooling (pg.Pool)
- Varje API-anrop skapar inte en ny databasanslutning.  
- Poolen återanvänder anslutningar och skyddar Postgres från överbelastning.  
- Gör API:t mycket snabbare under tung trafik (t.ex. 1000 samtidiga requests).  
- Detta är en viktig del av skalbarheten.

## PgBoss för bakgrundsjobb / kö
- API:t lägger bara bokningar i kön → svarar snabbt.  
- Workern tar hand om tunga saker: OpenAI, Pexels, Resend.  
- Skyddar API:t från att bli långsamt av externa anrop.  
- Kö-baserad arkitektur klarar trafikspikar utan problem.

## Separat Worker-process
- Kör tunga externa anrop i bakgrunden utan att blockera API:t.  
- Robust design som speglar hur riktiga SaaS-system fungerar.  
- Kan skalas horisontellt:  
  ```bash
  docker compose up --scale email-worker=3
  ```

## Resend (e-post)
- Enkel och modern e-posttjänst med bra API.  
- Bra för test och produktion.

## OpenAI och Pexels (AI + media)
- Visar hur AI kan integreras i processen för att skapa mervärde.  
- Genererar flyttplats innehåll och bilder i bekräftelsemejlet.

# Databasstruktur

<img width="1156" height="570" alt="image" src="https://github.com/user-attachments/assets/61524117-5e36-47cc-a710-fd5954ff02a6" />


## Varför denna modell?
- Tydliga relationer.
- Skalar bra vid hög last.
- Separat email_logs gör det enkelt att felsöka och analysera mejlflödet.
  




