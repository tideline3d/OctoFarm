let filterBy = "none";

let sortBy = "percent";

const getSorting = function(){
    return sortBy;
};

const getFilter = function(){
    return filterBy;
};

const updateSorting = function(sorting){
    sortBy = sorting;
};
const updateFilter = function(filter){
    filterBy = filter;
};
exports.getSorting = getSorting;
exports.getFilter = getFilter;
exports.updateSorting = updateSorting;
exports.updateFilter = updateFilter;