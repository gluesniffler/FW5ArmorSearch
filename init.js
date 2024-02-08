let xmlContent = '';
let skillList = [];
let itemList = [];

let db = null;
let objectStore = null;
let openRequest = indexedDB.open('MASSDB', 1);

function fetchSkills(){
    return fetch('dat/SkillBase.xml')
    .then(response => response.text())
    .then(data => {
        let parser = new DOMParser();
        let xmlDOM = parser.parseFromString(data, 'application/xml');
        skillTypes = xmlDOM.querySelectorAll('SkillType');
        skillTypes.forEach(skillType => {
            skillType.querySelectorAll('Data').forEach(skillParent => {
                skillParent.querySelectorAll('Option').forEach(skill => {
                    skillList.push({
                        'type': skillType.getAttribute('TypeName'),
                        'parentId': skillParent.getAttribute('ID'),
                        'parentName': skillParent.getAttribute('Name'),
                        'pointsReq': skill.getAttribute('Point'),
                        'name': skill.textContent,
                        'isNegative': (Math.sign(skill.getAttribute('Point')) < 1) ? true : false,
                    });
                });
            });
        });
   }); 
}

function fetchItems(){
    return fetch('dat/Item.xml')
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDOM = parser.parseFromString(data, 'application/xml');
            items = xmlDOM.querySelectorAll('data')
            items.forEach(item => {
                itemList.push({
                    'hr': item.getAttribute('HR'),
                    'name': item.textContent,
                });
            });
        });
}

function createSkillStore(db) {
    const storeSkills = db.createObjectStore('skills',  {autoIncrement: 'true'});
    storeSkills.createIndex('skill_type', ['type']);
    storeSkills.createIndex('parent_id', ['parentId']);
    storeSkills.createIndex('parent_name', ['parentName']);
    storeSkills.createIndex('points_required', ['pointsReq']);
    storeSkills.createIndex('name', ['name']);
    storeSkills.createIndex('is_negative', ['isNegative']);
}

function createItemStore(db){
    const storeItems = db.createObjectStore('items',  {autoIncrement: 'true'});
    storeItems.createIndex('hr', ['hr']);
    storeItems.createIndex('name', ['name']);
}

function populateStore(dbpointer, storename, entries){
    const transaction = dbpointer.transaction([storename], 'readwrite');
    const ObjectStore = transaction.objectStore(storename);

    entries.forEach(entry => {
        ObjectStore.add(entry);
    });

    transaction.oncomplete = function(event) {
        console.log(storename + " added successfully!");
    };

    transaction.onerror = function(event) {
        console.error("Error adding entry type: " + storename + ", Error: " +  event.target.error);
    };
}

openRequest.onupgradeneeded = function (e) {
    db = e.target.result;
    console.log('running onupgradeneeded');

    // Creating the object stores.
    createSkillStore(db);
    createItemStore(db);
};

openRequest.onsuccess = function (e) {
    console.log('running onsuccess');
    db = e.target.result;

    // Populating the object stores.
    fetchSkills().then(() => {
        populateStore(db, 'skills', skillList);
    });

    fetchItems().then(() => {
        populateStore(db, 'items', itemList);
    });
    
};

openRequest.onerror = function (e) {
    console.log('onerror! doesnt work');
};