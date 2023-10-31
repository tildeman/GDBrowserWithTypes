/**
 * @fileoverview Routing page for redirects.
 */

import express from "express";

const router = express.Router();

router.get("/icon", function(req, res) {
    res.redirect('/iconkit');
});
router.get("/obj/:text", function(req, res) {
    res.redirect('/obj/' + req.params.text);
});
router.get("/leaderboards/:id", function(req, res) {
    res.redirect('/leaderboard/' + req.params.id);
});
router.get("/profile/:id", function(req, res) {
    res.redirect('/u/' + req.params.id);
});
router.get("/p/:id", function(req, res) {
    res.redirect('/u/' + req.params.id);
});
router.get("/l/:id", function(req, res) {
    res.redirect('/leaderboard/' + req.params.id);
});
router.get("/a/:id", function(req, res) {
    res.redirect('/analyze/' + req.params.id);
});
router.get("/c/:id", function(req, res) {
    res.redirect('/comments/' + req.params.id);
});
router.get("/d/:id", function(req, res) {
    res.redirect('/demon/' + req.params.id);
});

export default router;