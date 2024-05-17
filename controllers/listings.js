const { response } = require("express");
const Listing = require("../models/listing");
const ExpressError = require('../utils/ExpressError');
let fetchPromise = import('node-fetch');
const mapToken = process.env.MAP_TOKEN;

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
};

module.exports.renderNewForm =  (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: { path: "author" }, }).populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
   
    console.log(listing);
    res.render("listings/show.ejs", {listing});
};


module.exports.createListing = async (req, res, next) => {

const query = req.body.listing.location;

const Url = `https://us1.locationiq.com/v1/search.php?key=${mapToken}&q=${encodeURIComponent(query)}&format=json`;

fetchPromise.then(module => {
    const fetch = module.default; 
    fetch(Url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
       
       
          const latitude = data[0].lat;
          const longitude = data[0].lon;
          
          console.log("Coordinates:", latitude, longitude);
       
      })
      .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
      });
     
});

    let url = req.file.path;
    let filename = req.file.filename;
    console.log(url, "..", filename);
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id; 
    newListing.image = { url, filename };

  

    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash('success', 'New Listing Created!');
    res.redirect('/listings');
   
};

module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", {listing, originalImageUrl});  
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    
    if(typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
