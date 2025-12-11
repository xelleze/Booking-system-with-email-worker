
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

Skapa en `.env`-fil i projektroten (eller använd `.env.local`) med:

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

## Bonus 1:

Arkitekturen är redan testad för hög belastning.  
Ett eget stresstest (`stresstest.js`) skickade **1000 samtidiga POST-requests** mot `/api/v1/booking`. Resultatet:

- API:et svarade snabbt eftersom det endast gör DB-writes och lägger jobb i kön  
- Alla 1000 kunder och bokningar skrevs korrekt till databasen  
- Workern fortsatte arbeta i bakgrunden tills alla mejl var skickade  
- Systemet förblev stabilt utan timeouts eller överbelastning  

Detta visar att lösningen klarar trafikspikar utan att användaren påverkas, eftersom det tunga arbetet inte ligger i själva API-anropet.

Vid ännu större trafik skulle nästa steg vara:

- Skala ut med fler worker-processer (horisontell skalning), något som arkitekturen redan stödjer

## Bonus 2:

Jag skulle använda samma designmönster som i projektet

1. API:t tar emot en bokning  
2. API:t lägger ett nytt jobb i kön
3. En separat worker hämtar CRM-jobben och:
   - läser bokningsdata  
   - anropar CRM:s API  
   - loggar resultatet  

På samma sätt som mejlen skickas idag skulle CRM-synkningen ske **asynkront och isolerat** från själva API-anropet.

## Bonus 3:

AI används redan i den här implementationen för att:

- Generera personligt innehåll i bekräftelsemejlet baserat på den aktuella flyttadressen

### Ytterligare AI-potential inom samma flöde
 
- automatiska uppföljningsmeddelanden (t.ex. dagen innan flytten)
- Fokus ligger på att AI ska förbättra **kundupplevelsen**

# Resultat

## Formulär - Kund fyller i namn, e-post och önskat flyttdatum
<img width="870" height="561" alt="image" src="https://github.com/user-attachments/assets/b3e972c7-290d-4bfe-ae1c-d11673e54d1d" />

## Bekräftelse - Skicka ett automatiskt bekräftelsemejl
<img width="1315" height="739" alt="image" src="https://github.com/user-attachments/assets/aa2a776f-551a-480f-b4ca-c31a2bcbcd92" />


## Vad jag skulle förbättra med mer tid

### 1. Förbättrat UI/UX
- Bättre validering i formuläret  
- Tydligare bekräftelsesida  
- Loading-states och bättre användarfeedback  

### 2. Kö-övervakning / Admin Dashboard
- Visa antal väntande jobb  
- Visa senaste `email_logs`  
- Möjlighet att trigga om-skick  

### 3. Auth & Adminvy
- Inloggning för att se bokningar, kunder och mejlloggar  
- Filtrering, sökning och statusrapporter  


