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