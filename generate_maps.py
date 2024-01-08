# generate_maps.py

from app import app
from helpers import get_map_boundaries, generate_url_and_colorscale, create_map_zones, min_max_depth_zones, get_url_image
from models import Tempdata, Maps
from database import db

from datetime import datetime

import random
import json


""" Global variables """
# Longitude & latitude boundaries of complete dataset (url = https://erddap.emodnet.eu/erddap/griddap/bathymetry_2022.html)
DB_BOUNDARIES = {
    'min_lat': 15.000520833333335,
    'max_lat': 89.99947916665815,
    'min_lon': -35.99947916666667,
    'max_lon': 42.999479166657686,
}

# difficulties
valid_difficulties = ['bathyal', 'abyssal', 'hadal']
""" Global variables """

def generate_and_save_maps(difficulties_to_rerun=None):

     with app.app_context():
        app.config['maps_generation_in_progress'] = True

        global valid_difficulties

        if difficulties_to_rerun:
            difficulties_to_generate = difficulties_to_rerun
        else:
            difficulties_to_generate = valid_difficulties
        
        difficulties_to_rerun = []

        for difficulty in difficulties_to_generate:
            if difficulty == 'bathyal':
                grid_width = 6
            elif difficulty == 'abyssal':
                grid_width = 7
            elif difficulty == 'hadal':
                grid_width = 8

            # Determine map boundaries, print url and generate colorscale
            map_boundaries = get_map_boundaries(DB_BOUNDARIES)
            full_url, colorscale = generate_url_and_colorscale(map_boundaries)
            url = f'{full_url}'

            # Divide map in zones and identify deepest/shallowest zones + playability of the map
            map_zones = create_map_zones(map_boundaries, grid_width)
            deepest_zones, shallowest_zones, playability = min_max_depth_zones(map_zones)

            # Define our threshold of playability (90% at max of land)
            elevation_threshold = 0.8
            if playability < elevation_threshold:
                print(f"-- {difficulty} not playable --")
                difficulties_to_rerun.append(difficulty)
                continue

            else:
                # Generate url images for each zone
                for zone in map_zones:
                    zone['url'] = get_url_image(zone, shallowest_zones[0]['min_depth'], deepest_zones[0]['max_depth'])

                # Generate 3 random zones excluding min and max depth zones for displaying starting tiles + create eligible tiles for later
                all_zones = list(range(grid_width ** 2))
                excluded_zones = {zone['zone_index'] for zone in shallowest_zones + deepest_zones}
                remaining_zones = set(all_zones) - excluded_zones
                remaining_zones = list(remaining_zones)

                if len(remaining_zones) >= 3:
                    random_zones = random.sample(remaining_zones, 3)
                else:
                    random_zones = remaining_zones.copy()
                    remaining_samples = 3 - len(random_zones)
                    if remaining_samples > 0:
                        random_zones.extend(shallowest_zones[:remaining_samples])
                print(f'**Random Zones : {random_zones}')

                eligible_zones = list(set(remaining_zones) - set(random_zones))
                print(f'**Eligible Zones : {eligible_zones}')

                app.config['maps_generation_in_progress'] = False

                # Convert lists to JSON-compatible strings
                map_zones_json = json.dumps(map_zones)
                deepest_zones_json = json.dumps([zone['zone_index'] for zone in deepest_zones])
                shallowest_zones_json = json.dumps([zone['zone_index'] for zone in shallowest_zones])
                random_zones_json = json.dumps(random_zones)
                eligible_zones_json = json.dumps(eligible_zones)

                # Save the map data to the Maps model
                current_date = datetime.now().date()
                map_instance = Maps(
                    day=current_date,
                    difficulty_level=difficulty,
                    min_lat=map_boundaries['min_lat'],
                    max_lat=map_boundaries['max_lat'],
                    min_long=map_boundaries['min_lon'],
                    max_long=map_boundaries['max_lon'],
                    url=url,
                    colorscale=colorscale,
                    grid_width=grid_width,
                    map_zones=map_zones_json,
                    deepest_zones=deepest_zones_json,
                    shallowest_zones=shallowest_zones_json,
                    random_zones=random_zones_json,
                    eligible_zones=eligible_zones_json
                )
                db.session.add(map_instance)

        tempdata_entries = Tempdata.query.all()
        for entry in tempdata_entries:
            entry.reset_fields()
        db.session.commit()

        if difficulties_to_rerun:
            return generate_and_save_maps(difficulties_to_rerun)

generate_and_save_maps()