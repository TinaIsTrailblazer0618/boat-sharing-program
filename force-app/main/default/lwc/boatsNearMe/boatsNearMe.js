import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';

const ERROR_VARIANT = 'error';
const ERROR_TITLE = 'Error loading Boats Near Me';
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';

export default class BoatsNearMe extends LightningElement {
    // Creates the component boatsNearMe and show boats that are near the user, 
    // using the browser location and boat type. Display them on a map, 
    // always with the consent of the user (and only while the page is open).
    
    @api boatTypeId;
    // Private
    mapMarkers = [];
    isLoading = true;
    isRendered = false;
    boatData = undefined;
    error = undefined;
    latitude;
    longitude;

    // Adds the wired method from the Apex Class
<<<<<<< HEAD
    // Names it getBoatsByLocation, and use latitude, longitude and boatTypeId
    // Handles the result and calls createMapMarkers
=======
    // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
    // Handle the result and calls createMapMarkers
>>>>>>> 5d5c04999aad02bd2efa39699c2f505b4e7fe18f
    @wire(getBoatsByLocation, { latitude: '$latitude', longitude: '$longitude', boatTypeId: '$boatTypeId'})
    wiredBoatsJSON({ error, data }) {
        if (data) {
            this.boatData = data;
            createMapMarkers(boatData);
            this.isLoading = false;
            this.error = undefined;
        } else if (error) {
            this.isLoading = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: reduceErrors(error).join(', '),
                    variant: ERROR_VARIANT
                })
            );
        }
    }

    // Controls the isRendered property
    // Calls getLocationFromBrowser()
    renderedCallback() {
        if (this.isRendered) {
            return;
        }
        this.isRendered = true;
        this.getLocationFromBrowser();
    }

    // Gets the location from the Browser
    // position => {latitude and longitude}
    getLocationFromBrowser() {
        navigator.geolocation.getCurrentPosition(position => {
            // Gets the Latitude and Longitude from Geolocation API
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
        })
    }

    // Creates the map markers
    createMapMarkers(boatData) {
        const newMarkers = boatData.map(boat => {
            [{
            location: {
                Latitude: boat.fields.Geolocation__Latitude__s.value,
                Longitude: boat.fields.Geolocation__Longitude__s.value
            },
            title: boat.fields.Name.value,
            }]
        });

        let mapMarker = [{
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude
            },
            title: LABEL_YOU_ARE_HERE,
            icon: ICON_STANDARD_USER
        }];

        newMarkers.unshift(mapMarker);
        this.mapMarkers = newMarkers;
    }
}
