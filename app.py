# app.py

from flask import Flask, request, session, render_template, redirect, url_for, jsonify
from database import db
from config import DevelopmentConfig, ProductionConfig

from datetime import datetime

import os
import json
import uuid


app = Flask(__name__)


flask_env = os.getenv('FLASK_ENV', 'development')

if flask_env == 'production':
    app.config.from_object('config.ProductionConfig')
else:
    app.config.from_object('config.DevelopmentConfig')


with app.app_context():
    db.init_app(app)
    from models import Userdata, Tempdata, Maps, Historic
    db.create_all()
    db.session.commit()


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
        print('new_user created')

        new_user_temp = Tempdata(new_user.id, 0, 0, 0, 0)
        db.session.add(new_user_temp)
        db.session.commit()
        print('new_user_temp created')
    
    return render_template('landing.html')


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
    current_date = datetime.now().date()
    formatted_date = current_date.strftime('%Y-%m-%d')
    map_instance = Maps.query.filter_by(difficulty_level=difficulty, day=formatted_date).first()

    if map_instance:
        map_data = map_instance.serialize()
        # Parse JSON fields
        map_data['map_zones'] = json.loads(map_data['map_zones'])
        map_data['deepest_zones'] = json.loads(map_data['deepest_zones'])
        map_data['shallowest_zones'] = json.loads(map_data['shallowest_zones'])
        map_data['random_zones'] = json.loads(map_data['random_zones'])
        map_data['eligible_zones'] = json.loads(map_data['eligible_zones'])

        return jsonify(map_data)
    
    else:
        return jsonify({'error': 'Map data not found for the specified difficulty and day'}), 404


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
                print(url)
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

    
# from scheduler import scheduled_maps
# scheduled_maps()


if __name__ == '__main__':
    app.run(debug=False) 