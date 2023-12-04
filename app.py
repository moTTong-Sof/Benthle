from flask import Flask, request, session, current_app, render_template, redirect, url_for, jsonify
from helpers import get_map_boundaries, generate_url_and_colorscale, create_map_zones, min_max_depth_zones, get_url_image, load_map_data
from database import db
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

import atexit
import random
import json
import uuid



app = Flask(__name__)
app.secret_key = 'mysecretkey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///benthle.db'



with app.app_context():
    db.init_app(app)
    from models import Userdata, Tempdata, Maps, Historic
    db.create_all()
    db.session.commit()



""" Global variables """
# Longitude & latitude boundaries of complete dataset (url = https://erddap.emodnet.eu/erddap/griddap/bathymetry_2022.html)
DB_BOUNDARIES = {
    'min_lat': 15.000520833333335,
    'max_lat': 89.99947916665815,
    'min_lon': -35.99947916666667,
    'max_lon': 42.999479166657686,
}

# Jsonfile for storing our maps informations & difficulties
json_file_path = 'stored_maps.json'
valid_difficulties = ['bathyal', 'abyssal', 'hadal']
current_date = datetime.now().date()
""" Global variables """



@app.route("/generate_maps", methods=["GET"])
def generate_and_save_maps(difficulties_to_rerun=None):

     with app.app_context():
        app.config['maps_generation_in_progress'] = True

        global valid_difficulties

        if difficulties_to_rerun:
            difficulties_to_generate = difficulties_to_rerun
        else:
            difficulties_to_generate = valid_difficulties
        
        existing_maps = {}
        try:
            with open(json_file_path, 'r') as f:
                existing_maps = json.load(f)
        except FileNotFoundError:
            pass

        maps = existing_maps.copy()
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
                random_zones = random.sample(remaining_zones, 3)
                print(f'**Random Zones : {random_zones}')
                eligible_zones = list(remaining_zones - set(random_zones))
                print(f'**Eligible Zones : {eligible_zones}')

                # Condense all informations into a dict
                map_data = {
                    'full_url' : full_url,
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

                app.config['maps_generation_in_progress'] = False

                # Save the map data to the Maps model
                global current_date
                map_instance = Maps(
                    day=current_date,  
                    difficulty_level=difficulty,
                    min_lat=map_boundaries['min_lat'],
                    max_lat=map_boundaries['max_lat'],
                    min_long=map_boundaries['min_lon'],
                    max_long=map_boundaries['max_lon'],
                    url=full_url
                )
                db.session.add(map_instance)
    

        with open(json_file_path, 'w') as f:
            print("Writing data to JSON file...")
            json.dump(maps, f)

        tempdata_entries = Tempdata.query.all()
        for entry in tempdata_entries:
            entry.reset_fields()
        db.session.commit()

        if difficulties_to_rerun:
            return generate_and_save_maps(difficulties_to_rerun)

        if current_app and current_app.config.get('TESTING', False):
            return render_template('homepage.html')


@app.before_request
def redirect_to_landing():
    if 'user_id' not in session and request.endpoint != 'landing':
        return redirect(url_for('landing'))


@app.route("/", methods=['GET', 'POST'])
def landing():

    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
        new_user = Userdata(session['user_id'], None, 0, 0, 0, 0, 0, 0)
        db.session.add(new_user)

        new_user_temp = Tempdata(new_user.id, 0, 0, 0, 0)
        db.session.add(new_user_temp)
        db.session.commit()
        
        print(new_user)
        print(new_user_temp)
    
    return render_template('landing.html')


@app.route("/leaderboard")
def leaderboard():
    return render_template('layout.html')


@app.route("/tutorial")
def tutorial():
    return render_template('tutorial.html')


@app.route("/homepage", methods=["GET", "POST"])
def homepage():

    if request.method == "POST":
        difficulty = request.form.get('difficulty')
        return redirect(f"/game?difficulty={difficulty}")

    return render_template('homepage.html')


@app.route("/game")
def game():
    difficulty = request.args.get('difficulty', 'bathyal')
    return render_template('game.html', difficulty=difficulty)


@app.route("/game/data")
def game_data():
    difficulty = request.args.get('difficulty', 'bathyal')
    map_data = load_map_data(json_file_path, difficulty)
    return jsonify(map_data)


@app.route('/update_database', methods=['GET', 'POST'])
def update_database():
    
    if request.method == 'GET':
        stat_name = request.args.get('stat')
        table_arg = request.args.get('table')

        if stat_name == 'all':
            if table_arg == 'Tempdata':
                instances = Tempdata.query.filter_by(user_id=session['user_id']).all()
            elif table_arg == 'Historic':
                instances = Historic.query.filter_by(player_id=session['user_id']).all()
            else:
                instances = Userdata.query.filter_by(id=session['user_id']).all()

            serialized_data = [instance.serialize() for instance in instances]
            response = {'status': 'success', 'data': serialized_data}

        else:
            if table_arg == 'Tempdata':
                instance = Tempdata.query.filter_by(user_id=session['user_id']).first()
            else:
                instance = Userdata.query.filter_by(id=session['user_id']).first()

            value = getattr(instance, stat_name, None)
            if isinstance(value, bool):
                value = str(value).lower()
            response = {'status': 'success', 'data': value}
        
        return jsonify(response)

    elif request.method == 'POST': 
        stat_name = request.args.get('stat')
        value = request.args.get('value')
        table_arg = request.args.get('table')

        if value.lower() == 'true':
            value = True
        elif value.lower() == 'false':
            value = False

        try:
            if table_arg == 'Tempdata':
                instance = Tempdata.query.filter_by(user_id=session['user_id']).first()
            elif table_arg == 'Userdata':
                instance = Userdata.query.filter_by(id=session['user_id']).first()
            elif table_arg == 'Historic':
                url = Maps.query.filter_by(difficulty_level=stat_name, day=value).first()
                user_historic = Historic(session['user_id'], value, stat_name, url.url)
                db.session.add(user_historic)
            
            if table_arg != 'Historic':
                setattr(instance, stat_name, value)
                db.session.commit()
                updated_value = getattr(instance, stat_name, None)
                response = {'status': 'success', 'data': updated_value}
            else:
                db.session.commit()
                response = {'status': 'success', 'message': 'Historic data added successfully'}
            
            db.session.commit()
            return jsonify(response)

        except Exception as e:
            print(f"Error updating database: {e}")
            response = {'status': 'error', 'message': 'Internal Server Error'}
            return jsonify(response), 500

    else:
        response = {'status': 'error', 'message': 'Invalid request method'}
        return jsonify(response)


scheduler = BackgroundScheduler()
scheduler.add_job(func=generate_and_save_maps, trigger="interval", minutes=15)
scheduler.start()
# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())


if __name__ == '__main__':
    app.run(debug=False)