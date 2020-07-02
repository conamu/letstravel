const Hotel = require('../models/hotel.js');
const multer = require('multer');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CD_NAME,
  api_key: process.env.CD_APIKEY,
  api_secret: process.env.CD_APISECRET,
});

const storage = multer.diskStorage({});

const upload = multer({ storage });

exports.upload = upload.single('image');

exports.pushToCloudinary = (req, res, next) => {
  if (req.file) {
    cloudinary.uploader
      .upload(req.file.path)
      .then((result) => {
        req.body.image = result.public_id;
        next();
      })
      .catch(() => {
        req.flash('danger', 'Problem uploading image.');
        res.redirect('/admin/add');
      });
  } else {
    next();
  }
};

exports.allPage = async (req, res, next) => {
  try {
    const allHotels = await Hotel.find({ available: { $eq: true } });
    res.render('all_hotels', { title: 'All Hotels', allHotels });
    // res.json(allHotels)
  } catch (error) {
    next(error);
  }
};

exports.allCountries = async (req, res, next) => {
  try {
    const allCountries = await Hotel.distinct('country');
    res.render('all_countries', { title: 'Browse by Country', allCountries });
  } catch (errors) {
    next(error);
  }
};

exports.hotelsByCountry = async (req, res, next) => {
  try {
    const countryParam = req.params.country;
    const countryList = await Hotel.find({ country: countryParam });
    res.render('hotels_by_country', {
      title: `Browse by Country: ${countryParam}`,
      countryList,
    });
  } catch (error) {
    next(error);
  }
};

exports.hotelDetail = async (req, res, next) => {
  try {
    const hotelParam = req.params.hotel;
    const hotelData = await Hotel.find({ _id: hotelParam });
    res.render('hotel_detail', {
      title: 'Lets Travel - Hotel Details',
      hotelData,
    });
  } catch (error) {
    next(error);
  }
};

exports.homePageFilters = async (req, res, next) => {
  try {
    const hotels = Hotel.aggregate([
      { $match: { available: true } },
      { $sample: { size: 6 } },
    ]);

    const countries = Hotel.aggregate([
      { $group: { _id: '$country' } },
      { $sample: { size: 6 } },
    ]);

    const [filteredCountries, filteredHotels] = await Promise.all([
      countries,
      hotels,
    ]);

    res.render('index', { filteredCountries, filteredHotels });
  } catch (error) {
    next(error);
  }
};

exports.signUp = (req, res, next) => {
  // validate user Info
  next();
};

exports.login = (req, res, next) => {
  // Login user
};

exports.searchResults = async (req, res, next) => {
  try {
    const searchQuery = req.body;
    const parsedStars = parseInt(searchQuery.rating) || 1;
    const parsedSort = parseInt(searchQuery.sorting) || 1;
    const searchData = await Hotel.aggregate([
      { $match: { $text: { $search: `\"${searchQuery.destination}\"` } } },
      { $match: { available: true, star_rating: { $gte: parsedStars } } },
      { $sort: { cost_per_night: parsedSort } },
    ]);
    // res.json(searchData);
    res.render('search_results', {
      title: 'Search results ',
      searchQuery,
      searchData,
    });
  } catch (error) {
    next(error);
  }
};

// Admin Stuff

exports.adminPage = (req, res) => {
  res.render('adminPage', { title: 'Admin' });
};

exports.adminAddGet = (req, res) => {
  res.render('adminAdd', { title: 'Admin - Add Hotel' });
};

exports.adminAddPost = async (req, res, next) => {
  try {
    const hotel = new Hotel(req.body);
    await hotel.save();
    req.flash('success', `${hotel.hotel_name} added succesfully!`)
    res.redirect(`/all/${hotel._id}/details`);
  } catch (error) {
    next(error);
  }
};

exports.adminEditGet = (req, res) => {
  res.render('edit_remove', { title: 'Admin - Edit Hotel' });
};

exports.adminEditPost = async (req, res, next) => {
  try {
    const hotelId = req.body.hotel_id || null;
    const hotelName = req.body.hotel_name || null;

    const hotelData = await Hotel.find({
      $or: [{ _id: hotelId }, { hotel_name: hotelName }],
    }).collation({
      locale: 'en',
      strength: 2,
    });

    if (hotelData.length > 0) {
      res.render('hotel_detail', { title: 'Admin - Edit Hotel', hotelData });
      return;
    } else {
      req.flash('info', 'No matches found!')
      res.redirect('/admin/edit-remove');
    }
  } catch (error) {
    next(error);
  }
};

exports.updateGet = async (req, res, next) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.hotelId });
    res.render('adminAdd', { title: 'Admin - Update Hotel', hotel });
  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    req.flash('success', `${hotel.hotel_name} updated successfully!`)
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findByIdAndUpdate(hotelId, req.body, {
      new: true,
    });
    res.redirect(`/all/${hotelId}/details`);
  } catch (error) {
    next(error);
  }
};

exports.deleteGet = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findOne({ _id: hotelId });
    res.render('adminAdd', { title: 'Admin - Delete Hotel', hotel });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findByIdAndRemove({ _id: hotelId });
    req.flash(`${hotel.hotel_id} has been deleted!`)
    res.redirect('/');
  } catch (error) {
    next(error);
  }
};
