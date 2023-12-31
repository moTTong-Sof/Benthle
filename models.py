# models.py
from database import db

class Userdata(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    last_win = db.Column(db.String)
    today_attempts = db.Column(db.Integer)
    current_streak = db.Column(db.Integer)
    max_streak = db.Column(db.Integer)
    bathyal = db.Column(db.Integer)
    abyssal = db.Column(db.Integer)
    hadal = db.Column(db.Integer)
    temp_datas = db.relationship('Tempdata', backref='userdata')

    def __init__(self, id, last_win, today_attempts, current_streak, max_streak, bathyal, abyssal, hadal):
        self.id = id
        self.last_win = last_win
        self.today_attempts = today_attempts
        self.current_streak = current_streak
        self.max_streak = max_streak
        self.bathyal = bathyal
        self.abyssal = abyssal
        self.hadal = hadal

    def __repr__(self):
        return f"{self.id}\n{self.last_win} - {self.today_attempts}\n{self.current_streak} - {self.max_streak}\n{self.bathyal} - {self.abyssal} - {self.hadal}"
    
    def serialize(self):
        return {
            'id': self.id,
            'last_win': self.last_win,
            'today_attempts': self.today_attempts,
            'current_streak': self.current_streak,
            'max_streak': self.max_streak,
            'bathyal': self.bathyal,
            'abyssal': self.abyssal,
            'hadal': self.hadal
        }
    

class Tempdata(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('userdata.id'))
    highest_exercise = db.Column(db.Integer)
    left_mid_game = db.Column(db.Boolean, default = False)
    attempts = db.Column(db.Integer)
    total_att_used = db.Column(db.Integer)

    def __init__(self, user_id, highest_exercise, left_mid_game, attempts, total_att_used):
        self.user_id = user_id
        self.highest_exercise = highest_exercise
        self.left_mid_game = left_mid_game
        self.attempts = attempts
        self.total_att_used = total_att_used

    def __repr__(self):
        return f"{self.user_id}\n{self.highest_exercise} - {self.left_mid_game}\n{self.attempts}"
    
    def serialize(self):
        return {
            'user_id': self.user_id,
            'highest_exercise': self.highest_exercise,
            'left_mid_game': self.left_mid_game,
            'attempts': self.attempts,
            'total_att_used': self.total_att_used
        }
    
    def reset_fields(self):
        self.highest_exercise = 0
        self.left_mid_game = False
        self.attempts = 0
        self.total_att_used = 0

    
class Historic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.String(36))
    day = db.Column(db.String)
    difficulty = db.Column(db.String)
    url = db.Column(db.String(512))

    def __init__(self, player_id, day, difficulty, url):
        self.player_id = player_id
        self.day = day
        self.difficulty = difficulty
        self.url = url

    def serialize(self):
        return {
                'day': self.day,
                'difficulty': self.difficulty,
                'url': self.url,
            }
    

class Maps(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.String)
    difficulty_level = db.Column(db.String)
    min_lat = db.Column(db.Float)
    max_lat = db.Column(db.Float)
    min_long = db.Column(db.Float)
    max_long = db.Column(db.Float)
    url = db.Column(db.String(512))
    map_zones = db.Column(db.String)
    colorscale = db.Column(db.String(512))
    grid_width = db.Column(db.Integer)
    deepest_zones = db.Column(db.String)
    shallowest_zones = db.Column(db.String)
    random_zones = db.Column(db.String)
    eligible_zones = db.Column(db.String)

    def __init__(self, day, difficulty_level, min_lat, max_lat, min_long, max_long, url, colorscale, grid_width, map_zones, deepest_zones, shallowest_zones, random_zones, eligible_zones):
        self.day = day
        self.difficulty_level = difficulty_level
        self.min_lat = min_lat
        self.max_lat = max_lat
        self.min_long = min_long
        self.max_long = max_long
        self.url = url
        self.colorscale = colorscale
        self.grid_width = grid_width
        self.map_zones = map_zones
        self.deepest_zones = deepest_zones
        self.shallowest_zones = shallowest_zones
        self.random_zones = random_zones
        self.eligible_zones = eligible_zones

    def serialize(self):
        return {
            'day': self.day,
            'difficulty_level': self.difficulty_level,
            'min_lat': self.min_lat,
            'max_lat': self.max_lat,
            'min_long': self.min_long,
            'max_long': self.max_long,
            'url': self.url,
            'colorscale': self.colorscale,
            'grid_width': self.grid_width,
            'map_zones': self.map_zones,
            'deepest_zones': self.deepest_zones,
            'shallowest_zones': self.shallowest_zones,
            'random_zones': self.random_zones,
            'eligible_zones': self.eligible_zones
        }