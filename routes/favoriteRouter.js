const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const Favorites = require('../models/favorites');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        if(favorites == null)
	        res.json({dishes: []});  // added because of error, but don't know why the error is occuring
        else
	        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if(!favorite) {
            Favorites.create({user: req.user._id})
            .then((favorite) => {
                for(i=0; i<req.body.length; i++)
                    if(favorite.dishes.indexOf(req.body[i]._id) === -1)
                        favorite.dishes.push(req.body[i]);
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
                .catch((err) => next(err));
            })
            .catch((err) => next(err));
        }
        else {
            for(i=0; i<req.body.length; i++)
                if(favorite.dishes.indexOf(req.body[i]._id) < 0)
                    favorite.dishes.push(req.body[i]);
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch((err) => next(err));
        }
    })
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type','text/plain');
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }

    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if(!favorite) {
            Favorites.create({user: req.user._id})
            .then((favorite) => {
                if(favorite.dishes.indexOf(req.params.dishId) === -1)
                    favorite.dishes.push({"_id": req.params.dishId});
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
                .catch((err) => next(err));
            })
            .catch((err) => next(err));
        }
        else {

            if(favorite.dishes.indexOf(req.params.dishId) < 0) {
                favorite.dishes.push({"_id": req.params.dishId});
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
                })
                .catch((err) => next(err));
            }
            else {
                res.statusCode = 403;
                res.setHeader('Content-Type','text/plain');
                res.end('Dish'+req.params.dishId+' already added to favorites');
            }
        }
    })
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type','text/plain');
    res.end('PUT operation not supported on /favorites/'+req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        var index = favorite.dishes.indexOf(req.params.dishId);
        if( index >=0 ) {
            favorite.dishes.splice(index,1);
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch((err) => next(err));
        }
        else {
            res.statusCode = 404;
            res.setHeader('Content-Type','text/plain');
            res.end('Dish'+req.params.dishId+' not in your favorites');
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;