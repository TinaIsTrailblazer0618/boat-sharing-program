import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi'; 
// Import message service features required for subscribing and the message channel
import { subscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
// Custom Labels Imports
// import labelDetails for Details
// import labelReviews for Reviews
// import labelAddReview for Add_Review
// import labelFullDetails for Full_Details
// import labelPleaseSelectABoat for Please_select_a_boat
import labelDetails from '@salesforce/label/c.Details';
import labelReviews from '@salesforce/label/c.Reviews';
import labelAddReview from '@salesforce/label/c.Add_Review';
import labelFullDetails from '@salesforce/label/c.Full_Details';
import labelPleaseSelectABoat from '@salesforce/label/c.Please_select_a_boat';
// Boat__c Schema Imports
// import BOAT_ID_FIELD for the Boat Id
// import BOAT_NAME_FIELD for the boat Name
import BOAT_ID_FIELD from '@salesforce/schema/Boat__c.Id';
import BOAT_NAME_FIELD from '@salesforce/schema/Boat__c.Name';
import BOAT_TYPE_FIELD from '@salesforce/schema/Boat__c.BoatType__c';
import BOAT_LENGTH_FIELD from '@salesforce/schema/Boat__c.Length__c';
import BOAT_PRICE_FIELD from '@salesforce/schema/Boat__c.Price__c';
import BOAT_DESCRIPTION_FIELD from '@salesforce/schema/Boat__c.Description__c';

const BOAT_FIELDS = [BOAT_ID_FIELD, BOAT_NAME_FIELD];

export default class BoatDetailTabs extends NavigationMixin(LightningElement) {
    boatId;
    wiredRecord;
    boatType = BOAT_TYPE_FIELD;
    boatLength = BOAT_LENGTH_FIELD;
    boatPrice = BOAT_PRICE_FIELD;
    boatDescription = BOAT_DESCRIPTION_FIELD;
    label = {
        labelDetails,
        labelReviews,
        labelAddReview,
        labelFullDetails,
        labelPleaseSelectABoat,
    };

    @wire(getRecord, { recordId: '$boatId', fields: BOAT_FIELDS })
    wiredRecord;

    // Decide when to show or hide the icon
    // returns 'utility:anchor' or null
    get detailsTabIconName() { 
        return (this.wiredRecord ? 'utility:anchor' : null);
    }

    // Utilize getFieldValue to extract the boat name from the record wire
    get boatName() {
        return getFieldValue(this.wiredRecord.data, BOAT_NAME_FIELD);
    }

    // Private
    subscription = null;

    // By using the MessageContext @wire adapter, unsubscribe will be called
    // implicitly during the component destruction lifecycle.
    @wire(MessageContext)
    messageContext;

    // Subscribe to the message channel
    subscribeMC() {
        // local boatId must receive the recordId from the message
        this.subscription = subscribe(
            this.messageContext,
            BOATMC,
            (message) => this.handleMessage(message),
            { scope: APPLICATION_SCOPE }
        );
    }

    // Handler for message received by component
    handleMessage(message) {
        this.boatId = message.recordId;
    }

    // Calls subscribeMC()
    connectedCallback() {
        this.subscribeMC();
    }

    // Navigates to record page
    navigateToRecordViewPage() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.boatId,
                actionName: 'view' 
            }
        });
    }

    // Navigates back to the review list, and refreshes reviews component
    handleReviewCreated() { 
        this.template.querySelector('lightning-tab').activeTabValue = 'reviews';
    }
}
