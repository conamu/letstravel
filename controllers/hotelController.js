//Require the Hotel datamodel
const Hotel = require('../models/hotel.js');
//Require the multer Module
const multer = require('multer');
//Require the Cloudinary module to Upload Media through the API.
const cloudinary = require('cloudinary').v2;


// Configure Cloudinary Service
cloudinary.config({
  cloud_name: process.env.CD_NAME,
  api_key: process.env.CD_APIKEY,
  api_secret: process.env.CD_APISECRET,
});

// Define the Storage for Uploads. Multer Stores it in the /tmp.
const storage = multer.diskStorage({});

// Declare the upload location with the multer storage.
const upload = multer({ storage });

// This function Uploads the next single image in Multer storage.
exports.upload = upload.single('image');

// Here, I used cloudinarys uploader to Upload the image and set the image name for the Databse to cloudinarys randomly generated image name.
exports.pushToCloudinary = (req, res, next) => {
  // if the request contains a file
  if (req.file) {
    // Call cloudinarys uploader object
    cloudinary.uploader
      //upload the file from the requests filepath
      .upload(req.file.path)
      //Get the result of the API upload and set the Filename for the Database to Cloudinarys Image ID.
      .then((result) => {
        req.body.image = result.public_id;
        // Pass on to the Next Action.
        next();
      })
      //If an error has occured, throw an error and redirect back to the add route.
      .catch(() => {
        req.flash('danger', 'Problem uploading image.');
        res.redirect('/admin/add');
      });
  } else {
    // If no image in the request, pass on to the next action of the route.
    next();
  }
};

// Get all Hotels from teh Database and pass the Data to the PUG template.
exports.allPage = async (req, res, next) => {
  try {
    // Only get Hotels which are marked as available.
    const allHotels = await Hotel.find({ available: { $eq: true } });
    // Render the Template
    res.render('all_hotels', { title: 'All Hotels', allHotels });
  } catch (error) {
    next(error);
  }
};

// Get all Countries and pass the Data to the Template.
exports.allCountries = async (req, res, next) => {
  try {
    // Get all Hotels from that Country, using the distinct aggregation method of Mongoose.
    const allCountries = await Hotel.distinct('country');
    // Render the Template.
    res.render('all_countries', { title: 'Browse by Country', allCountries });
  } catch (errors) {
    next(error);
  }
};

// Get all Hotels of that specific country
exports.hotelsByCountry = async (req, res, next) => {
  try {
    const countryParam = req.params.country;
    const countryList = await Hotel.find({ country: countryParam });
    // Render Template
    res.render('hotels_by_country', {
      title: `Browse by Country: ${countryParam}`,
      countryList,
    });
  } catch (error) {
    next(error);
  }
};

// Get all hotel details
exports.hotelDetail = async (req, res, next) => {
  try {
    const hotelParam = req.params.hotel;
    const hotelData = await Hotel.find({ _id: hotelParam });
    // Render hotel template.
    res.render('hotel_detail', {
      title: 'Lets Travel - Hotel Details',
      hotelData,
    });
  } catch (error) {
    next(error);
  }
};

// Only show 6 randomly selected hotels and countries which are marked as available.
exports.homePageFilters = async (req, res, next) => {
  try {
    // Aggregate Hotels matching availability, only get 6.
    const hotels = Hotel.aggregate([
      { $match: { available: true } },
      { $sample: { size: 6 } },
    ]);

    // Aggregate Countries matching one ID per country so no countries are double. Show only 6.
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

// Search for hotels and locations.
exports.searchResults = async (req, res, next) => {
  try {
    // Get the Searchquery from the Bodys searchfields.
    const searchQuery = req.body;
    // Parse values of the Sorting fields into a Variable containing integer values.
    const parsedStars = parseInt(searchQuery.rating) || 1;
    const parsedSort = parseInt(searchQuery.sorting) || 1;
    // Aggregate Data in the Database into a searchData Constant.
    // We need to match The search query with text indexes and the  sort fields.
    const searchData = await Hotel.aggregate([
      { $match: { $text: { $search: `\"${searchQuery.destination}\"` } } },
      { $match: { available: true, star_rating: { $gte: parsedStars } } },
      { $sort: { cost_per_night: parsedSort } },
    ]);
    // Finally, pass the data to the Template and render it to the Browser.
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
