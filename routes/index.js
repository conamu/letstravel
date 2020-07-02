const express = require('express');
const router = express.Router();
const hc = require('../controllers/hotelController');
const uc = require('../controllers/userController');

/* GET home page. */
router.get('/', hc.homePageFilters);

router.get('/all', hc.allPage);

router.get('/all/:hotel/details', hc.hotelDetail);

router.get('/countries', hc.allCountries);

router.get('/countries/:country', hc.hotelsByCountry);

router.post('/results', hc.searchResults);

// ADMIN ROUTES

router.get('/admin', uc.isAdmin, hc.adminPage);

router.get('/admin/*', uc.isAdmin)

router.get('/admin/add', hc.adminAddGet);
router.post('/admin/add', hc.upload, hc.pushToCloudinary, hc.adminAddPost);

router.get('/admin/edit-remove', hc.adminEditGet);
router.post('/admin/edit-remove', hc.adminEditPost);

router.get('/admin/:hotelId/update', hc.updateGet);
router.post(
  '/admin/:hotelId/update',
  hc.upload,
  hc.pushToCloudinary,
  hc.updatePost
);

router.get('/admin/:hotelId/delete', hc.deleteGet);
router.post('/admin/:hotelId/delete', hc.deletePost);

// USER ROUTES

router.get('/sign-up', uc.signUpGet);
router.post('/sign-up', uc.signUpPost, uc.loginPost);
router.get('/login', uc.loginGet);
router.post('/login', uc.loginPost);
router.get('/logout', uc.logout);

module.exports = router;
