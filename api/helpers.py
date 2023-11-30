import random
import requests
import math
import json

import pandas as pd
import numpy as np

from database import db


def get_map_boundaries(db_boundaries, map_size=5):
    """
    This function generate random boundaries for a square map.

    Arguments : 
    - db_boundaries : the geographical boundaries of our database
    - map_size : size of the map we want to display in percentage

    Return :
    - map_boundaries : a dict with min/max latitudes and longitudes
    """
    # Extract db boundaries
    min_lat, max_lat = db_boundaries['min_lat'], db_boundaries['max_lat']
    min_lon, max_lon = db_boundaries['min_lon'], db_boundaries['max_lon']

    # Calculate latitude and longitude range
    lat_range = max_lat - min_lat
    lon_range = max_lon - min_lon

    # Define the range of our new map as a percentage of the dataset size
    map_lat_size = lat_range * (map_size / 100)
    map_lon_size = lon_range * (map_size / 100)

    # Generate random boundaries
    min_lat_random = random.uniform(min_lat, max_lat - map_lat_size)
    max_lat_random = min_lat_random + map_lat_size
    min_lon_random = random.uniform(min_lon, max_lon - map_lon_size)
    max_lon_random = min_lon_random + map_lon_size
    
    print(f"**Lat: {min_lat_random}, {max_lat_random}\n**Lon: {min_lon_random}, {max_lon_random}")

    map_boundaries = {
        'min_lat' : min_lat_random,
        'max_lat' : max_lat_random,
        'min_lon' : min_lon_random,
        'max_lon' : max_lon_random
    }

    return map_boundaries


def generate_url_and_colorscale(map_boundaries):
    """
    This function will print a url for the map as a .png (with legend and axis) for checking purposes
    and eventually to register them later in order to create a history for each player.
    It also create a .png url that isolate the colorscale so we can display it into game.html
    
    Arguments : 
    - map_boundaries : a dict with min/max latitudes and longitudes of our map

    Return :
    - colorscale : a url with only the colorscale
    
    """
    # Initializing our url's information
    base_url = "https://erddap.emodnet.eu/erddap/griddap/bathymetry_2022.png"
    miny, maxy = map_boundaries['min_lat'], map_boundaries['max_lat']
    minx, maxx = map_boundaries['min_lon'], map_boundaries['max_lon']
    draw_value = "surface"
    vars_value = "longitude|latitude|elevation"
    global color
    color = "Rainbow"  # Rainbow | LightRainbow | KT_deep 
    colorbar_value = f"{color}||Linear|||"

    # Construct the URLs per these reccomendations : https://erddap.emodnet.eu/erddap/griddap/documentation.html#GraphicsCommands
    url = (
        f"{base_url}?elevation%5B({miny}):({maxy})%5D%5B({minx}):({maxx})%5D"
        f"&.draw={draw_value}&.vars={vars_value}"
        f"&.colorBar={colorbar_value}"
    )
    colorscale = url + "&.legend=Only"
    
    # Checking urls 
    print(f"**Image URL: {url}\n**Colorscale URL: {colorscale}")

    return url, colorscale


def create_map_zones(map_boundaries, grid_width):
    """
    This function will divide our map into zones accordingly to the difficulty chose by the player

    Arguments :
    - map_boundaries : a dict with the randomly generated boundaries
    - grid_width : the size of the grid according to the difficulty chosen by the player

    Return :
    - zones : a list of dictionnaries with an index and each zone boundaries (a list)
    
    """
    # Extract the bounds of the map
    miny, maxy = map_boundaries['min_lat'], map_boundaries['max_lat']
    minx, maxx = map_boundaries['min_lon'], map_boundaries['max_lon']

    # Generate a grid of points
    x_points = np.linspace(minx, maxx, grid_width + 1)
    y_points = np.linspace(maxy, miny, grid_width + 1) # Inverting miny and maxy so values start from top-right

    # Create zones based on the grid points
    zones = []
    for row in range(grid_width):
        for col in range(grid_width):
            x1, x2 = x_points[col], x_points[col + 1]
            y1, y2 = y_points[row], y_points[row + 1]
            zone = {
                'index' : row * grid_width + col,
                'boundaries' : [y2, y1, x1, x2] # Top-right logic
            }
            zones.append(zone)

    return zones


def get_erddap_data(zone):
    """
    This function will fetch elevation datas from EMODnet's ERDDAP so we can identify the shallowest and deepest zones.
    Eventually, this could also be used so we could plot the data ourselves.

    Arguments :
    - zone : a dict with an index and zone boundaries (a list)

    Return :
    - a dict with an index, max_depth and min_depth found in said zone
    
    """
    # Construc URL for ERDDAP elevations data
    base_url = "https://erddap.emodnet.eu/erddap/griddap/bathymetry_2022.json?elevation%5B"  
    min_lat, max_lat, min_lon, max_lon = zone['boundaries']
    dataset_url = f"{base_url}({min_lat}):10:({max_lat})%5D%5B({min_lon}):10:({max_lon})%5D"

    # Retrieve data from ERDDAP with consolidated URL
    response = requests.get(dataset_url)
    if response.status_code == 200:
        data = response.json()
        # Targeting the dict 'rows' since it has lon/lat/elev values
        rows_data = data.get('table', {}).get('rows', [])
        if rows_data:
            # Extract relevant data from 'rows'
            rows = pd.DataFrame(rows_data, columns=['latitude', 'longitude', 'elevation'])

            # Check playability based on elevation values
            playability_score = check_playability(rows)

            # Find the lowest and highest elevation values
            max_depth = rows['elevation'].min()
            min_depth = rows['elevation'][rows['elevation'] <= 0].max()

            return {'zone_index': zone['index'], 'max_depth': max_depth, 'min_depth' : min_depth, 'playability_score': playability_score}

    else:
        print(f"Error: {response.status_code}")
        return {}


def min_max_depth_zones(map_zones):
    """
    This function will compare the min and max depth of each zones to determine which zone has the shallowest and the deepest point.

    Arguments :
    - map_zones : a dict with all the zones indexes and boundaries

    Return :
    - deepest_zone, shallowest_zone : two dicts with a zone index and the max/min elevation value
    
    """
    # Initialize variables
    deepest_zones = []
    shallowest_zones = []
    playability = 0
    
    for zone in map_zones:
        # Call previous function to check the elevation values
        zone_data = get_erddap_data(zone)
        print(zone_data)

        # Update playability
        playability += zone_data.get('playability_score', 0)

        # Skip the current iteration if both max_depth and min_depth are nan
        if pd.isna(zone_data['max_depth']) and pd.isna(zone_data['min_depth']):
            continue

        # Replace values if a deeper or shallower value is found in the current zone
        if not deepest_zones or zone_data['max_depth'] < deepest_zones[0]['max_depth']:
            deepest_zones = [zone_data]
        elif zone_data['max_depth'] == deepest_zones[0]['max_depth']:
            deepest_zones.append(zone_data)

        if zone_data['min_depth'] is not None:
            if not shallowest_zones or zone_data['min_depth'] > shallowest_zones[0]['min_depth']:
                shallowest_zones = [zone_data]
            elif zone_data['min_depth'] == shallowest_zones[0]['min_depth']:
                shallowest_zones.append(zone_data)

    if not deepest_zones and not shallowest_zones:
        return [], [], playability

    # Check values
    print(f"**Deepest Zones: {', '.join(str(zone['zone_index']) for zone in deepest_zones)} (Max Depth: {deepest_zones[0]['max_depth']})")
    print(f"**Shallowest Zones: {', '.join(str(zone['zone_index']) for zone in shallowest_zones)} (Min Depth: {shallowest_zones[0]['min_depth']})")

    return deepest_zones, shallowest_zones, playability


def check_playability(rows, elevation_threshold = 0.9):
    """
    This function check for the playability of the map aka if there is enough "sea" in it to be played
    Arguments : 
    - zone_data : data fetched from erddap
    - elevation_threshold : threshold for the percentage of elevations set to None (currently 90%)
    Return : True or False
    """  
    total_points = len(rows)
    none_count = rows['elevation'].isna().sum()

    return (none_count / total_points) < elevation_threshold


def get_url_image(zone, min_depth, max_depth, round_increment=100):
    """
    This function will print a url for the map as a .png (with legend and axis) for checking purposes
    and eventually to register them later in order to create a history for each player.
    It also create a .png url that isolate the colorscale so we can display it into game.html
    
    Arguments : 
    - zone : a dict with an index and zone boundaries (a list)
    - min_depth, max_depth : values used to define the range of colorscale in each zone otherwise each zone will follow its own min/max elevation value
    - round_increment : trying to round the values of min/max depth to match the colorscale generated by EMODnet

    Return :
    - url : a url with only the data plotted in it
    """
    # Initializing our url's information
    base_url = "https://erddap.emodnet.eu/erddap/griddap/bathymetry_2022.transparentPng"
    min_lat, max_lat, min_lon, max_lon = zone['boundaries']
    draw_value = "surface"
    vars_value = "longitude|latitude|elevation"

    # Check if the values are not NaN before rounding
    if not math.isnan(min_depth):
        rounded_min_depth = round(min_depth / round_increment) * round_increment
    else:
        rounded_min_depth = 0

    if not math.isnan(max_depth):
        rounded_max_depth = round(max_depth / round_increment) * round_increment
    else:
        rounded_max_depth = 0

    # global var color set in generate_url_and_colorscale()
    colorbar_value = f"{color}||Linear|{rounded_min_depth}|{rounded_max_depth}|"

    # Construct the URL : https://erddap.emodnet.eu/erddap/griddap/documentation.html#GraphicsCommands
    url = (
        f"{base_url}?elevation%5B({min_lat}):({max_lat})%5D%5B({min_lon}):({max_lon})%5D"
        f"&.draw={draw_value}&.vars={vars_value}"
        f"&.colorBar={colorbar_value}&.land=under"
    )

    return url


def load_map_data(json_file_path, difficulty):
    # Fetch the data stored in the json file created
    print(difficulty)
    with open(json_file_path, 'r') as f:
        maps = json.load(f)
    return maps.get(difficulty, {})
