// imports
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import USER_OBJECT from '@salesforce/schema/User';
import getAllReviews from '@salesforce/apex/BoatDataService.getAllReviews';

export default class BoatReviews extends NavigationMixin(LightningElement) {
    // Private
    userObj = USER_OBJECT;
    boatId;
    error;
    boatReviews;
    isLoading = false;
    
    // Getter and Setter to allow for logic to run on recordId change
    @api
    get recordId() { 
        return this.boatId;
    }
    set recordId(value) {
    //sets boatId attribute
    //sets boatId assignment
    //get reviews associated with boatId
        this.setAttribute('boatId', value);
        this.boatId = value;
        this.getReviews();
    }
    
    // Getter to determine if there are reviews to display
    get reviewsToShow() {
        return this.boatReviews && Array.isArray(this.boatReviews) && this.boatReviews.length > 0;
    }
    
    // Public method to force a refresh of the reviews invoking getReviews
    @api
    refresh() { 
        this.getReviews();
    }
    
    // Imperative Apex call to get reviews for given boat
    // returns immediately if boatId is empty or null
    // sets isLoading to true during the process and false when it’s completed
    // Gets all the boatReviews from the result, checking for errors.
    getReviews() {
        if (!this.boatId) {
            return;
        }
        this.isLoading = true;
        getAllReviews({ boatId: this.boatId })
            .then((result) => {
                this.boatReviews = result;
                this.error = undefined;
                this.isLoading = false; 
            })
            .catch((error) => {
                this.error = error;
                this.boatReviews = undefined;
            });       
    }
    
    // Helper method to use NavigationMixin to navigate to a given record on click
    navigateToRecord(event) {
        // Stop the event's default behavior (don't follow the HREF link) and prevent click bubbling up in the DOM...
        event.preventDefault();
        event.stopPropagation();
        this.recordId = event.target.dataset.recordId;  
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: this.userObj,
                actionName: 'view'
            }
        });
    }
}
