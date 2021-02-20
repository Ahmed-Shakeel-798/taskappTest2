const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = new express.Router();

//  tasks
router.post('/task', auth, async (req, res) => {
    //const newTask = new Task(req.body);
    const newTask = new Task({
        ...req.body,
        owner: req.user._id,
    });
    try {
        await newTask.save();
        res.status(201).send(newTask);
    } catch (e) {
        res.status(400).send(e);
    }
});

// ?completed=true
// ?limit=10&skip=20
// ?sortBy=createdAT:desc

router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.status) {
        match.status = req.query.status === 'true';
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
       
    }

    try {
        //const tasks = await Task.find({owner: req.user._id});
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    } catch (e) {
        res.status(400).send(e);
    }

});

router.get('/task/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.patch('/task/:id', auth, async (req, res) => {

    const requestedUpdates = Object.keys(req.body);
    const allowedUpdates = ["description", "status"];
    const isValid = requestedUpdates.every((update) => allowedUpdates.includes(update));

    if (!isValid) {
        return res.status(400).send("bad request");
    }

    const _id = req.params.id;
    try {
        //const task =  await Task.findByIdAndUpdate(_id,req.body,{new: true, runValidators: true});
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        requestedUpdates.forEach((update) => task[update] = req.body[update]);
        await task.save();

        res.status(200).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/task/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;