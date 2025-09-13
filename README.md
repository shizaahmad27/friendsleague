# FriendsLeague

FriendLeague er en sosial applikasjon som kombinerer meldingsfunksjonalitet med konkurransefunksjoner. Brukere kan kommunisere én-til-én eller i grupper, opprette "ligaer" med regler, poengsystem og leaderboard, samt arrangere events.

## 🛠️ Teknologistack

### Frontend
- **React Native** - Cross-platform mobilapp
- **TypeScript** - Type-sikkerhet
- **Zustand** - State management
- **React Navigation** - Navigasjon
- **Socket.io Client** - Sanntidskommunikasjon

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Type-sikkerhet
- **Prisma** - ORM for database
- **PostgreSQL** - Hoveddatabase
- **Redis** - Caching og sanntidsdata
- **Socket.io** - WebSocket for sanntidskommunikasjon
- **JWT** - Autentisering

### Infrastruktur
- **Docker** - Containerisering
- **AWS S3** - Filopplasting
- **Firebase** - Push notifications

## 📱 Hovedfunksjoner

1. **Brukerhåndtering** - Innlogging, registrering, venneliste
2. **Kommunikasjon** - Direktemeldinger, gruppechat, mediedeling
3. **Leagues** - Opprettelse, poengsystem, leaderboard
4. **Events** - Arrangementer knyttet til ligaer

## 🏗️ Prosjektstruktur

```
friendsleague/
├── backend/          # NestJS API
├── mobile/           # React Native app
├── shared/           # Delte typer og interfaces
└── docs/             # Dokumentasjon
```
