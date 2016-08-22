'use strict';

var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies

//console.log("Here0");
var PokemonGO = require('pokemon-go-node-api');
var a = new PokemonGO.Pokeio();
//console.log("Here1");
var twilio = require('twilio');
var client = twilio('ACc04160f235f5fef144dff3bedcaee430', '3c0197f58a98f59115aa4b4757f3df79');
var encounteredArray = [];
var encounteredRare = false;

//console.log("Here2");
var rarePokemonList =
    ["Bulbasaur",
        "Ivysaur",
        "Venusaur",
        "Charmander",
        "Charmeleon",
        "Charizard",
        "Squirtle",
        "Wartortle",
        "Blastoise",
        "Pikachu",
        "Raichu",
        "Sandslash",
        "Nidoqueen",
        "Nidoking",
        "Ninetales",
        "Wigglytuff",
        "Vileplume",
        "Dugtrio",
        "Persian",
        "Golduck",
        "Primeape",
        "Arcanine",
        "Kadabra",
        "Alakazam",
        "Machoke",
        "Machamp",
        "Tentacruel",
        "Graveler",
        "Golem",
        "Slowbro",
        "Magnemite",
        "Magneton",
        "Farfetch'd",
        "Doduo",
        "Dewgong",
        "Grimer",
        "Muk",
        "Cloyster",
        "Gastly",
        "Haunter",
        "Gengar",
        "Onix",
        "Drowzee",
        "Hypno",
        "Voltorb",
        "Electrode",
        "Exeggutor",
        "Marowak",
        "Hitmonlee",
        "Hitmonchan",
        "Lickitung",
        "Weezing",
        "Rhyhorn",
        "Rhydon",
        "Chansey",
        "Kangaskhan",
        "Seadra",
        "Seaking",
        "Mr. Mime",
        "Scyther",
        "Jynx",
        "Electabuzz",
        "Magmar",
        "Magikarp",
        "Gyarados",
        "Lapras",
        "Ditto",
        "Porygon",
        "Omanyte",
        "Omastar",
        "Kabuto",
        "Kabutops",
        "Aerodactyl",
        "Snorlax",
        "Articuno",
        "Zapdos",
        "Moltres",
        "Dratini",
        "Dragonair",
        "Dragonite",
        "Mewtwo",
        "Mew"
    ];

// //Neals
// var location = { 
//     type: 'coords',
//     coords: {
//         latitude: 32.642654,
//         longitude: -97.128717,
//         altitude: 250,
//     }
// };

// My house
var location = {
    type: 'coords',
    coords: {
        latitude: 32.593893,
        longitude: -97.249945,
        altitude: 217,
    }
};

// //some place
//32.59496 , -97.254795
// //32.623790, -97.261802
// var location = {
//     type: 'coords',
//     coords: {
//         latitude: 32.59496,
//         longitude: -97.254795,
//         altitude: 217,
//     }
// };

// // Tacos Oasis
// var location = {
//     type: 'coords',
//     coords: {
//         latitude: 32.630827,
//         longitude: -97.271075,
//         altitude: 210,
//     }
// };

// //Shelbys Rd
// var location = {
//     type: 'coords',
//     coords: {
//         latitude: 32.615985,
//         longitude: -97.253137,
//         altitude: 210,
//     }
// };


var searchRadius = 100;
var searchingForRare = false;
var searchingForRareCount = 0;
var searchingForRareName = '';
var rareCenterLat = location.coords.latitude;
var rareCenterLong = location.coords.longitude;
var radarOn = true;

console.log("Center location is ", location);
console.log("Search radius is ", searchRadius, "meters");

var username = 'juandiego7189';
var password = 'Pokemonmaster123';
var provider = 'google';

app.post('/api/users', function(req, res) {
    location.coords.latitude = Number(req.body.latitude);
    location.coords.longitude = Number(req.body.longitude);
    searchRadius = Number(req.body.radius);
    radarOn = req.body.mode;
    searchingForRare = false;
    searchingForRareCount = 0;
    searchingForRareName = '';

    console.log("req.body:", req.body);
    console.log("Center location updated to:", location);
    console.log("Search radius updated to", searchRadius, "meters");

    res.send(location.latitude + ' ' + location.longitude + ' ' + searchRadius);
});

var port = 8080;
app.listen(port);
console.log('Express server started on port %s', port);


var getRandomPointInRadius = function(radius, original_lat, original_lng) {
    var r = radius / 111300, // = radius in meters
        y0 = original_lat,
        x0 = original_lng,
        u = Math.random(),
        v = Math.random(),
        w = r * Math.sqrt(u),
        t = 2 * Math.PI * v,
        x = w * Math.cos(t),
        y1 = w * Math.sin(t),
        x1 = x / Math.cos(y0)

    var newY = y0 + y1;
    var newX = x0 + x1;

    var randomLocation = {
        type: 'coords',
        coords: {
            latitude: Number(newY.toFixed(6)),
            longitude: Number(newX.toFixed(6)),
            altitude: 217,
        }
    };

    return randomLocation;
};

var setRandomLocation = function(instance, radius, centerLat, centerLong) {
    var randomLocation = getRandomPointInRadius(radius, centerLat, centerLong);

    instance.SetLocation(randomLocation, function(error, coordinates) {
        if (error) {
            console.log(error)
        } else {
            console.log("Setting location to ", coordinates.latitude, ",", coordinates.longitude, "...");

        }

    })

}

//Interval for sending out rare pokemon locations
setInterval(function() {
    var message = '';

    //Filter encountered array
    var uniqueEncounteredArray = encounteredArray.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
    })

    if (uniqueEncounteredArray.length) {
        for (var i = 0; i < uniqueEncounteredArray.length; i++) {
            message += uniqueEncounteredArray[i];
        }
    }

    //If message isn't empty send it out
    if (message != '') {
        if (encounteredRare) { //send only for rare pokemon
            encounteredRare = false;
            console.log("Sending out sms:", message);
            client.sendMessage({
                to: '8177052499',
                from: '8179853792',
                body: message
            });

            message = '';
            encounteredArray = [];
        }

    }
}, 60000);

//Interval for sending out common pokemon locations
setInterval(function() {
    var message = '';

    //Filter encountered array
    var uniqueEncounteredArray = encounteredArray.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
    })

    if (uniqueEncounteredArray.length) {
        for (var i = 0; i < uniqueEncounteredArray.length; i++) {
            message += uniqueEncounteredArray[i];
        }
    }
    //If message isn't empty send it out
    if (message != '') {
        console.log("Sending out sms:", message);
        client.sendMessage({
            to: '8177052499',
            from: '8179853792',
            body: message
        });
        message = '';
        encounteredArray = [];
    }

}, 5 * 60000);

var runInterval = function(rate) {

    setInterval(function() {
        a.Heartbeat(function(err, hb) {
            if (err) {
                console.log(err);
            }

            var searchCoordinates = a.GetLocationCoords();

            //console.log("Center coordinates", searchCoordinates.latitude, ",", searchCoordinates.longitude, "with radius", searchRadius , "meters...");
            console.log("Searching for poke men at coordinates", searchCoordinates.latitude, ",", searchCoordinates.longitude);
            if (hb.cells) {
                //Shows Nearby Pokemon
                for (var i = hb.cells.length - 1; i >= 0; i--) {
                    for (var j = 0; j < 6; j++) {
                        if (hb.cells[i].NearbyPokemon[j]) {
                            //console.log(a.pokemonlist[0])
                            var pokemon = a.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[j].PokedexNumber) - 1];
                            if (rarePokemonList.indexOf(pokemon.name) > -1) {
                                if (searchingForRare) {
                                    console.log("Rare pokemon nearby...but already looking for:", searchingForRareName);
                                } else {
                                    searchingForRare = true;
                                    searchingForRareName = pokemon.name;
                                    console.log("Rare pokemon nearby...Narrowing down search to 250m.");
                                    rareCenterLat = searchCoordinates.latitude;
                                    rareCenterLong = searchCoordinates.longitude;
                                }
                            }
                            console.log('1[+] There is a ' + pokemon.name + ' near.');


                        }
                    }
                }
            }

            // Show Catchable Pokemon
            if (hb.cells) {
                for (i = hb.cells.length - 1; i >= 0; i--) {

                    for (var j = hb.cells[i].MapPokemon.length - 1; j >= 0; j--) { // use async lib with each or eachSeries should be better :)
                        var currentPokemon = hb.cells[i].MapPokemon[j];
                        var pokedexInfo = a.pokemonlist[parseInt(currentPokemon.PokedexTypeId) - 1];
                        var link = "https://maps.google.com/maps?q=" + searchCoordinates.latitude + "," + searchCoordinates.longitude;
                        encounteredArray.push('Encountered pokemon ' + pokedexInfo.name + " at " + link + "\r\n");
                        console.log('Encountered pokemon ' + pokedexInfo.name + " at " + link);
                        if (rarePokemonList.indexOf(pokedexInfo.name) > -1) {
                            encounteredRare = true;
                            console.log("RAAAAAAAREEEEEEEEEE POKEMON!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                            if (searchingForRareName == pokedexInfo.name) {
                                searchingForRare = false;
                                searchingForRareCount = 0;
                                searchingForRareName = '';
                                console.log("Found that rare pokemon I was looking for. Clearing from list:", pokedexInfo.name);
                            }
                        }

                    }
                }
            }

            // //If message isn't empty send it out
            // if (message != '') {
            //     // if (encounteredRare) { //send only for rare pokemon
            //     client.sendMessage({
            //         to: '8177052499',
            //         from: '8179853792',
            //         body: message
            //     });
            //     // }

            // }

            if (searchingForRareCount > 100) {
                console.log("Giving up looking for rare pokemon:", searchingForRareName);
                searchingForRareCount = 0;
                searchingForRareName = '';
                searchingForRare = false;
            }

            if (searchingForRare == true) {
                console.log("Looking for rare pokemon:", searchingForRareName);
                setRandomLocation(a, 250, rareCenterLat, rareCenterLong);
                searchingForRareCount++;
            } else {
                setRandomLocation(a, searchRadius, location.coords.latitude, location.coords.longitude);
            }

        });
    }, rate);
}

a.init(username, password, location, provider, function(err) {
    if (err) throw err;

    console.log('1[i] Center location: ' + a.playerInfo.locationName);
    console.log('1[i] Center lat/long/alt: : ' + a.playerInfo.latitude + ' ' + a.playerInfo.longitude + ' ' + a.playerInfo.altitude);

    a.GetProfile(function(err, profile) {
        if (err) throw err;

        console.log('1[i] Username: ' + profile.username);
        console.log('1[i] Poke Storage: ' + profile.poke_storage);
        console.log('1[i] Item Storage: ' + profile.item_storage);

        var poke = 0;
        if (profile.currency[0].amount) {
            poke = profile.currency[0].amount;
        }

        console.log('1[i] Pokecoin: ' + poke);
        console.log('1[i] Stardust: ' + profile.currency[1].amount);

        runInterval(5000);
    });
});