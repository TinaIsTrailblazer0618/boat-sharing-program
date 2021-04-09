import { LightningElement, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { reduceErrors } from 'c/ldsUtils';
import { publish, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import NAME_FIELD from '@salesforce/schema/Boat__c.Name';
import LENGTH_FIELD from '@salesforce/schema/Boat__c.Length__c';
import PRICE_FIELD from '@salesforce/schema/Boat__c.Price__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Boat__c.Description__c';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';
const COLUMNS = [
    { label: 'Name', fieldName: NAME_FIELD.fieldApiName, type: 'text', editable: true },
    { label: 'Length', fieldName: LENGTH_FIELD.fieldApiName, type: 'text', editable: true },
    { label: 'Price', fieldName: PRICE_FIELD.fieldApiName, type: 'currency', editable: true },
    { label: 'Description', fieldName: DESCRIPTION_FIELD.fieldApiName, type: 'text', editable: true },
]

export default class BoatSearchResults extends LightningElement {
    boatTypeId = '';
    selectedBoatId;
    boats;
    error = undefined;
    isLoading = false;
    columns = COLUMNS;
    draftValues = [];

    // Wired Apex result so it can be refreshed programmatically
    wiredBoatsResult;

    // Initialize messageContext for Message Service
    // By using the MessageContext @wire adapter, unsubscribe will be called
    // implicitly during the component destruction lifecycle.
    @wire(MessageContext)
    messageContext;

    // wired getBoats method
    @wire(getBoats, { boatTypeId : '$boatTypeId' })
    wiredBoats(result) {
        this.wiredBoatsResult = result;
        if (result.data) {
            this.boats = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.boats = undefined;
        }
    }

    get listIsNotEmpty() {
        return this.boats && Array.isArray(this.boats) && this.boats.length > 0;
    }

    // public function that updates the existing boatTypeId property
    // searchBoats(event) in the boatSearch component passes the value of boatTypeId to this public function searchBoats(boatTypeId)
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) {
        this.notifyLoading(true);
        this.boatTypeId = boatTypeId;
        this.notifyLoading(false);
    }

    // this public function must refresh the boats asynchronously
    // uses notifyLoading
    @api
    async refresh() { 
        this.notifyLoading(true);
        await refreshApex(this.wiredBoatsResult);
        this.notifyLoading(false);
    }

    // this function must update selectedBoatId and call sendMessageService
    // this is an event from boatTile component where boatId was sent
    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId);
    }

    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) { 
        // explicitly pass boatId to the parameter recordId
        const payload = { recordId: boatId };

        publish(this.messageContext, BOATMC, payload);
    }

    // The handleSave method must save the changes in the Boat Editor
    // passing the updated fields from draftValues to the 
    // Apex method updateBoatList(Object data).
    // Show a toast message with the title
    // Clear lightning-datatable draft values
    handleSave(event) {
        // notify loading
        this.notifyLoading(true);

        const updatedFields = event.detail.draftValues;
        console.log(updatedFields);

        // Prepare the record IDs for getRecordNotifyChange()
        const notifyChangeIds = updatedFields.map(row => { return { "recordId" : row.Id } });

        // Update the records via Apex
        // Pass edited fields to the updateContacts Apex controller
        updateBoatList({ data: updatedFields })
            .then((result) => {
                console.log(JSON.stringify("Apex update result: "+ result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: SUCCESS_TITLE,
                        message: MESSAGE_SHIP_IT,
                        variant: SUCCESS_VARIANT
                    })
                );
                // Refresh LDS cache and wires
                getRecordNotifyChange(notifyChangeIds);

                // Display fresh data in the datatable
                return this.refresh().then(() => {
                    // Clear all draft values in the datatable
                    this.draftValues = [];
                })
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: ERROR_TITLE,
                        message: reduceErrors(error).join(', '),
                        variant: ERROR_VARIANT
                    })
                );
            })
            .finally(() => {
                this.notifyLoading(false);
            });
    }

    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) { 
        this.isLoading = isLoading;
        if (this.isLoading) {
            this.dispatchEvent(new CustomEvent("loading"));
        } else {
            this.dispatchEvent(new CustomEvent("doneloading"));
        }
    }
}
