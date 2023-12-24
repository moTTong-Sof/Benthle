# BENTHLE

## Video presentation: <[CLICK HERE](https://www.youtube.com/watch?v=7xxuVlqfn6Q&ab_channel=SofianeFarhra)>

[<img src="static/images/benthle mini.png" width="50%">](https://www.youtube.com/watch?v=7xxuVlqfn6Q&ab_channel=SofianeFarhra "Benthle presentation")

### Description:
Benthle is a web app that leverages bathymetric data from EMODnet to foster ocean literacy through a gamified experience.

This idea emerged when I participated 1 year ago to the EMODnet Open Sea Lab 3.0 Hackathon: as a non-scientist, my main goal was to turn scientific date more accessible to a wider public by turning it into a fun and seamless experience.

### How to play
Every day, users will have to grind their way throughout 3 maps, each of them representing a certain degree of difficulty. 

## Code explanation
### Backend files
***config.py*** defines environement variables such as `SECRET_KEY` and `DATABASE_URL`.

***database.py***'s purpose is to import sqlachemy in one place only and then be able to call it wherever it is needed to avoid multiple `db`.

***models.py*** defines 4 classes and their corresponding tables into the database. Each of classes also has a `serialize()` function for more practicity.
- `Userdata` stores "game" statistics from the users based upon their actions (last win, current win streak, how many time they finish each level, etc.). Players will then be able to check their statistics in the app.
- `Tempdata` stores temporary informations about the user to track its daily progression, mainly for "fairness" purposes because otherwise players could skip levels and/or reset the number of daily attempts just by leaving "mid-game". This class has a `reset_fields()` function that is called everyday, once new maps are created, to enable users to play again.
- `Maps` stores all the informations needed to reproduce the maps in our browser.
- `Historic` creates entries each time a user finishes a map. By keeping tracks of the maps "gathered", users can then visualize all of them in the app.

***helpers.py*** contains all the support functions for `generate_maps.py`
- `get_map_boundaries()` generates random boundaries for a square map.
    Arguments : 
    - db_boundaries : the geographical boundaries of our database
    - map_size : size of the map we want to display in percentage
    Return :
    - map_boundaries : a dict with min/max latitudes and longitudes
- `generate_url_and_colorscale()` prints a url for the map as a .png (with legend and axis) for checking purposes and a .png url that isolate the colorscale
    Arguments : 
    - map_boundaries : a dict with min/max latitudes and longitudes of our map
    Return :
    - url : the full url
    - colorscale : a url with only the colorscale
- `create_map_zones()` divides our map into zones accordingly to the difficulty chosen by the player
    Arguments :
    - map_boundaries : a dict with the randomly generated boundaries
    - grid_width : the size of the grid according to the difficulty chosen by the player
    Return :
    - zones : a list of dictionnaries with an index and each zone boundaries (a list)
- `get_erddap_data()` fetches elevation datas from EMODnet's ERDDAP so we can identify the shallowest and deepest zones. Eventually, it could also be used so we could plot the data ourselves.
    Arguments :
    - zone : a dict with an index and zone boundaries (a list)
    Return :
    - a dict with an index, max_depth and min_depth found in said zone
- `min_max_depth_zones()` compares the min and max depth of each zones to determine which zone has the shallowest and the deepest point.
    Arguments :
    - map_zones : a dict with all the zones indexes and boundaries
    Return :
    - deepest_zone, shallowest_zone : two dicts with a zone index and the max/min elevation value
- `check_playability()` checks for the playability of the map aka if there is enough "sea" in it to be played
    Arguments : 
    - zone_data : data fetched from erddap
    - elevation_threshold : threshold for the percentage of elevations set to None (currently 90%)
    Return : True or False
- `get_url_image()` generates a url for the map as a .png (without legend and axis)
    Arguments : 
    - zone : a dict with an index and zone boundaries (a list)
    - min_depth, max_depth : values used to define the range of colorscale in each zone otherwise each zone will follow its own min/max elevation value
    - round_increment : trying to round the values of min/max depth to match the colorscale generated by EMODnet
    Return :
    - url : a url with only the data plotted in it

***generate_maps.py*** combines all the ***helpers.py*** functions into `generate_and_save_maps()`. Every time the function is called, it will generate 3 maps according to the 3 difficulties of the game and then stores all the elements gathered into our database table `Maps`. If a map (or more) is deemed not playable, it will rerun the function only for it. It also resets the whole `Tempdata` table to allow players to play again for the day. 

***scheduler.py*** schedules `generate_and_save_maps()` everyday at 0:00 UTC and is called in ***app.py***.

***app.py*** contains the architecture of the app and its different routes.
- `redirect_to_landing()` is a before_request route that ensures that a new user will be redirected to the `landing()` route
- `landing()` creates a session for the new user and related entries into our database (`Userdata` and `Tempdata`)
- `tutorial()` renders `tutorial.html`
- `homepage()` has `GET` & `POST` methods. `GET` method renders `homepage.html`. When a user clicks on a difficulty level, it will `POST` the difficulty has an argument and redirect to the `game()` route
- `game()` is basically the default route to display the maps and is used as a transition to call the `game_data()` for better UX. This way, I was able to put a loading screen while the images where fetched instead of having a blank page while all the data was gathered.
- `game_data()` is called first client side. Once on the server side, it fetches all the relevant informations from `Maps` and send them back client side as a json object.
- `update_database()` has a `GET` and a `POST` method and is called client side. The `GET` method is used whenever the browser wants to acess specific data (such as statistical datas) and the `POST` method is used whenever the browser sends informations to update `Userdata`, `Tempdata` or `Historic` for the current user.

### Frontend files

### Design choices

### What's next ?

what your project is, 
what each of the files you wrote for the project contains and does,
and if you debated certain design choices, 
explaining why you made them. 

