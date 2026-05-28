"""Run this once to seed the database with realistic basketball scouting data."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import League, Team, Coach
from datetime import datetime, timezone, timedelta

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        if db.query(League).count() > 0:
            print("Database already seeded. Skipping.")
            return

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        leagues_data = [
            {"name": "EuroLeague", "country": "Europe", "region": "Europe", "level": "Professional"},
            {"name": "NBA G League", "country": "USA", "region": "North America", "level": "Professional"},
            {"name": "Liga ACB", "country": "Spain", "region": "Europe", "level": "Professional"},
            {"name": "Lega Basket Serie A", "country": "Italy", "region": "Europe", "level": "Professional"},
            {"name": "Turkish Basketball Super League", "country": "Turkey", "region": "Europe", "level": "Professional"},
        ]

        leagues = []
        for l in leagues_data:
            league = League(**l)
            db.add(league)
            leagues.append(league)
        db.commit()
        for l in leagues:
            db.refresh(l)

        teams_data = [
            {"league_id": leagues[0].id, "name": "Real Madrid Basketball", "city": "Madrid", "country": "Spain", "play_style": "Half-court structured offense"},
            {"league_id": leagues[0].id, "name": "Fenerbahce Beko", "city": "Istanbul", "country": "Turkey", "play_style": "Fast-paced transition offense"},
            {"league_id": leagues[0].id, "name": "CSKA Moscow", "city": "Moscow", "country": "Russia", "play_style": "Physical defense, half-court sets"},
            {"league_id": leagues[1].id, "name": "South Bay Lakers", "city": "El Segundo", "country": "USA", "play_style": "Transition offense, press defense"},
            {"league_id": leagues[1].id, "name": "Long Island Nets", "city": "Long Island", "country": "USA", "play_style": "3-and-D, perimeter-heavy"},
            {"league_id": leagues[2].id, "name": "FC Barcelona Basketball", "city": "Barcelona", "country": "Spain", "play_style": "Pick and roll, motion offense"},
            {"league_id": leagues[2].id, "name": "Valencia Basket", "city": "Valencia", "country": "Spain", "play_style": "Defensive intensity, rebounding"},
            {"league_id": leagues[3].id, "name": "Olimpia Milano", "city": "Milan", "country": "Italy", "play_style": "European structured play, screens"},
            {"league_id": leagues[4].id, "name": "Anadolu Efes", "city": "Istanbul", "country": "Turkey", "play_style": "High-tempo, aggressive pressing"},
        ]

        teams = []
        for t in teams_data:
            team = Team(**t, last_verified=now - timedelta(days=45) if len(teams) % 2 == 0 else None)
            db.add(team)
            teams.append(team)
        db.commit()
        for t in teams:
            db.refresh(t)

        coaches_data = [
            {"team_id": teams[0].id, "name": "Pablo Laso", "role": "Head Coach", "phone": "+34911000001", "email": "plaso@realmadrid.es", "verification_status": "verified"},
            {"team_id": teams[0].id, "name": "Alberto Angulo", "role": "Assistant Coach", "phone": "+34911000002", "email": "aangulo@realmadrid.es", "verification_status": "unverified"},
            {"team_id": teams[0].id, "name": "Juan Carlos Sánchez", "role": "General Manager", "phone": "+34911000003", "email": "jcsanchez@realmadrid.es", "verification_status": "verified"},

            {"team_id": teams[1].id, "name": "Sarunas Jasikevicius", "role": "Head Coach", "phone": "+905001000001", "email": "sjask@fenerbahce.org", "verification_status": "pending"},
            {"team_id": teams[1].id, "name": "Ahmet Demir", "role": "General Manager", "phone": "+905001000002", "email": "old.gm@fenerbahce.org", "verification_status": "unverified"},

            {"team_id": teams[2].id, "name": "Dimitris Itoudis", "role": "Head Coach", "phone": "+74951000001", "email": "ditoudis@cska.ru", "verification_status": "verified"},
            {"team_id": teams[2].id, "name": "Mikhail Prokhorov", "role": "Director of Basketball", "phone": "+74951000002", "email": "mprokhorov@cska.ru", "verification_status": "unverified"},

            {"team_id": teams[3].id, "name": "Darvin Ham", "role": "Head Coach", "phone": "+13100000001", "email": "dham@lakers.com", "verification_status": "pending"},
            {"team_id": teams[3].id, "name": "Rob Pelinka", "role": "General Manager", "phone": "+13100000002", "email": "rpelinka@lakers.com", "verification_status": "verified"},

            {"team_id": teams[4].id, "name": "Kevin Atkinson", "role": "Head Coach", "phone": "+15160000001", "email": "katkinson@brooklynnets.com", "verification_status": "unverified"},

            {"team_id": teams[5].id, "name": "Roger Grimau", "role": "Head Coach", "phone": "+34930000001", "email": "rgrimau@fcbarcelona.cat", "verification_status": "verified"},
            {"team_id": teams[5].id, "name": "Juan Carlos Navarro", "role": "Basketball Director", "phone": "+34930000002", "email": "jcnavarro@fcbarcelona.cat", "verification_status": "unverified"},

            {"team_id": teams[6].id, "name": "Alex Mumbru", "role": "Head Coach", "phone": "+34960000001", "email": "amumbru@valenciabasket.com", "verification_status": "unverified"},

            {"team_id": teams[7].id, "name": "Ettore Messina", "role": "Head Coach", "phone": "+390200000001", "email": "emessina@olimpiamilano.it", "verification_status": "verified"},
            {"team_id": teams[7].id, "name": "Christos Stavropoulos", "role": "General Manager", "phone": "+390200000002", "email": "cstavro@olimpiamilano.it", "verification_status": "unverified"},

            {"team_id": teams[8].id, "name": "Tomislav Mijatovic", "role": "Head Coach", "phone": "+905001000010", "email": "tmijat@efes.com.tr", "verification_status": "pending"},
        ]

        for c in coaches_data:
            last_verified = now - timedelta(days=30) if c["verification_status"] == "verified" else None
            coach = Coach(**c, last_verified=last_verified)
            db.add(coach)
        db.commit()

        print(f"Seeded {len(leagues)} leagues, {len(teams)} teams, {len(coaches_data)} coaches.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
