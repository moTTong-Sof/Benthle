from flask import Flask, request, session, render_template, redirect, url_for, jsonify
from helpers import get_map_boundaries, generate_url_and_colorscale, create_map_zones, min_max_depth_zones, get_url_image, load_map_data

import random
import json

app = Flask(__name__)
app.secret_key = 'Pacola'

""" Global variables """
# Longitude & latitude boundaries of complete dataset (url = https://erddap.emodnet.eu/erddap/griddap/bathymetry_2022.html)
DB_BOUNDARIES = {
    'min_lat': 15.000520833333335,
    'max_lat': 89.99947916665815,
    'min_lon': -35.99947916666667,
    'max_lon': 42.999479166657686,
}

# Jsonfile for storing our maps informations
json_file_path = 'stored_maps.json'


@app.route("/generate_maps", methods=["GET"])
def generate_and_save_maps():

    requested_difficulties = request.args.getlist('difficulty')
    valid_difficulties = ['easy', 'medium', 'hard']
    if requested_difficulties:
        difficulties_to_generate = [d for d in requested_difficulties if d in valid_difficulties]
    else:
        difficulties_to_generate = valid_difficulties
    # ex : /generate_maps?difficulty=medium&difficulty=hard
    
    existing_maps = {}
    try:
        with open(json_file_path, 'r') as f:
            existing_maps = json.load(f)
    except FileNotFoundError:
        pass

    maps = existing_maps.copy()
    for difficulty in difficulties_to_generate:
        if difficulty == 'easy':
            grid_width = 6
        elif difficulty == 'medium':
            grid_width = 7
        elif difficulty == 'hard':
            grid_width = 8

        # Determine map boundaries, print url and generate colorscale
        map_boundaries = get_map_boundaries(DB_BOUNDARIES)
        colorscale = generate_url_and_colorscale(map_boundaries)

        # Divide map in zones and identify deepest/shallowest zones + playability of the map
        map_zones = create_map_zones(map_boundaries, grid_width)
        deepest_zones, shallowest_zones, playability = min_max_depth_zones(map_zones)

        # Define our threshold of playability (90% at max of land)
        elevation_threshold = 0.8
        if playability < elevation_threshold:
            print("-- Not playable. Restarting --")
            return redirect(url_for('generate_and_save_maps', difficulty=difficulty))

        else:
            # Generate url images for each zone
            for zone in map_zones:
                zone['url'] = get_url_image(zone, shallowest_zones[0]['min_depth'], deepest_zones[0]['max_depth'])

            # Generate 3 random zones excluding min and max depth zones for displaying starting tiles + create eligible tiles for later
            all_zones = list(range(grid_width ** 2))
            excluded_zones = {zone['zone_index'] for zone in shallowest_zones + deepest_zones}
            remaining_zones = set(all_zones) - excluded_zones
            random_zones = random.sample(remaining_zones, 3)
            print(f'**Random Zones : {random_zones}')
            eligible_zones = list(remaining_zones - set(random_zones))
            print(f'**Eligible Zones : {eligible_zones}')

            # Condense all informations into a dict
            map_data = {
                'map_zones' : map_zones,
                'colorscale' : colorscale,
                'grid_width' : grid_width,
                'deepest_zones' : [zone['zone_index'] for zone in deepest_zones],
                'shallowest_zones' : [zone['zone_index'] for zone in shallowest_zones],
                'random_zones' : random_zones,
                'eligible_zones' : eligible_zones
            }

            # Save the generated map data in the 'maps' dictionary
            maps[difficulty] = map_data

    with open(json_file_path, 'w') as f:
        json.dump(maps, f)

    return "Maps generated and saved successfully!"


@app.route("/", methods=['GET', 'POST'])
def landing():
    route = 'homepage'
    return render_template('landing.html', route=route)


@app.route("/leaderboard")
def leaderboard():
    return render_template('layout.html')


@app.route("/tutorial")
def tutorial():
    return render_template('tutorial.html')


@app.route("/homepage", methods=["GET", "POST"])
def homepage():
    # Tracking current exercise for difficulty progression
    if request.method == "POST":
        difficulty = request.form.get('difficulty')
        if difficulty == 'easy':
            curr_ex = 1
        elif difficulty == 'medium':
            curr_ex= 2
        elif difficulty == 'hard':
            curr_ex = 3
        return redirect(f"/game?difficulty={difficulty}&curr_ex={curr_ex}")

    highest_completed_exercise = session.get('highest_completed_exercise', 0)

    return render_template('homepage.html', highest_completed_exercise=highest_completed_exercise)


@app.route("/game")
def game():
    difficulty = request.args.get('difficulty', 'easy')
    curr_ex = request.args.get('curr_ex', 1, type=int)
    return render_template('game.html', current_exercise=curr_ex, difficulty=difficulty)


@app.route("/game/data")
def game_data():
    difficulty = request.args.get('difficulty', 'easy')
    map_data = load_map_data(json_file_path, difficulty)
    return jsonify(map_data)


# Route to handle exercise completion
@app.route('/complete_exercise/<int:exercise_number>', methods=['GET'])
def complete_exercise(exercise_number):
    session['highest_completed_exercise'] = max(exercise_number, session.get('highest_completed_exercise', 0))
    return redirect(url_for('homepage'))


if __name__ == '__main__':
    app.run(debug=False)