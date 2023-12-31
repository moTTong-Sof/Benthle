# <p align="center"> BENTHLE </p>

<p align="center"> <img src="static/images/benthle mini.png" width="50%"> </p>

## <p align="center">Description </p>
Benthle is a web app that leverages bathymetric data from EMODnet @ERDDAP to foster ocean literacy through a gamified experience.

This idea emerged when I participated 1 year ago to the EMODnet Open Sea Lab 3.0 Hackathon: as a non-scientist, my main goal was to turn scientific date more accessible to a wider public by turning it into a fun and seamless experience.

### <p align="center">[CLICK HERE > Video presentation](https://www.youtube.com/watch?v=7xxuVlqfn6Q&ab_channel=SofianeFarhra)</p>

### How to play
BENTHLE has two main objectives: finding the **deepest** AND the **shallowest** point on the map. Every day, users will have to grind their way throughout 3 maps, each of them representing a certain degree of difficulty. 

You start with 5 attempts. Each time you flip a tile, you loose 1 attempt. Remaining attempts are transfered to the next difficulty level.

**Benthic wisdom**: When you flip a tile that is 1 tile away from the deepest or the shallowest point, a yellow flash will appear.

## <p align="center">What's next ?</p>
Concerning Benthle, here are some ideas I would like to see implemented :
- plotting the data directly in the app for more flexibility;
- customisation features for teachers and/or educators : selecting your tutorials and map boundaries, manually selecting the deepest and the shallowest tile and/or other specific tiles if you will to highlight something else (submarine mounts, shipwreck, etc);
- multiplayer feature : a 1v1v1v1 where each player has to go through each 3 level the fastest possible;
- reaching scientists to create a wide range of tutorials.

As mentionned in the description, the idea of Benthle emerged when I participated to the EMODnet hackathon and the goal was to turn scientific data more accessible as a whole, not only bathymetric data. I still have a lot of ideas concering other marince scientific fields such as biology, geology, physics, etc. and even plan to cross some of them through other gamified experience. If you are interesting in this idea, feel free to reach so we could sit and discuss about how it could be done !

## <p align="center">Code explanation</p>
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
- `generate_url_and_colorscale()` generates a url for the map as a .png (with legend and axis) for checking purposes and a .png url that isolate the colorscale by sending a query to @erddap EMODnet
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
- `get_erddap_data()` fetches elevation datas from EMODnet's @erddap so we can identify the shallowest and deepest zones. Eventually, it could also be used so we could plot the data ourselves.
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
***landing.js*** is responsible for the animation of the logo when arriving on the site for the first time and when the user leaves the tutorial

***navInteraction.js*** is responsible for the dynamic pop-ups of the navigation bar (homepage, rules, statistics and map's collection). It also fetches dynamically the informations needed for to display the player's statistics and map's collection.

***buttonInteraction.js*** dynamically displays which difficulty levels are available depending on the daily progression of the user. It ensures no one can do the same level twice and is supported by ***accessDifficultyControl.js*** to grant or prohibit access to higher levels.

***loadinglogic.js*** manages the animation displayed when loading the maps or the tutorial.

***tuto.js*** contains all the logic of the tutorial (progression bar, drag & drop functions, etc.)

***fetchMapData.js*** contains the function responsible for fetching all the informations needed to display each map into our `game.html`, namely the deepest and the shallowest zones, the size of the map, etc. It is also responsible or creating the map/grid in our html file.

***fetchTables.js*** contains both functions that allow us to query our database from the client side. One with a `GET` method if we want to access information to display it and one with a `POST` if we want to insert data in it. Both takes 2 arguments :
- a stat or value : the one we want to `GET` or `POST` 
- a table : the one we want to access, `Maps` or `Historic` for example. 

***games.js*** contains all the functions allowing the interactions in our game such as displaying the starting tiles, fliping the tiles, recognizing the nature of the tile, our "benthic wisdom" feature that allow the user to understand if the tile clicked is in a 1-tile range from a correct one, updating the stats, etc.

### Difficulties & design choices
At first, I was willing to plot the data myself. Since the dataset from EMODnet was huge, queries were taking way too much time. Since the game design of the app needed not to upload all the data at once, I added two steps to reduce as much as possible the amount of data queried at the same time : first by generating random boundaries for a map (approx. 5% of the total dataset) and second by dividing the subsequent dataset into the number of zones needed for the game (ranging from 36 to 64).

Once it was done, I tried to plot the data myself but I wasn't satisfied by the result of common data visualization python libraries. Graphically, it felt _very scientific_ and the idea was to turn the data more appealing, not only in the way it was accessed but visually. 

After some reasearch about @erddap, I realised it was possible to generate urls that would render transparent `png` so I decided to use the graphs generated by the platform. This solution allowed me not to store all the values, thus making the process lighter. The only counterpart is that all the tiles of the maps have a `src` linked to a `url`, which means that the connection of the user will impact the UX. If the connection is to slow, the images will load very slowly, if at all.

The backend process felt more complex but the frontend took a lot of time. Understanding how both would interact was also a big step for me and I spent a lot of time trying to figure it out.
