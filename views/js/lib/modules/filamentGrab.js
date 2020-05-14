import OctoFarmclient from "../octofarm.js";

export async function loadFilament(spoolId){
    let filament = await OctoFarmclient.get("filament/get/filament")
    filament = await filament.json();
    return filament;
}
export async function getProfile(spoolId){
    let profile = await OctoFarmclient.get("filament/get/profile")
    profile = await profile.json();
    return profile;
}
export async function getSelected(){
    let selected = await OctoFarmclient.get("filament/get/selected")
    selected = await selected.json();
    return selected;
}
export async function returnDropDown(){
    let spools = await loadFilament();
    let profiles = await getProfile();
    let selected = await getSelected();
    let dropObject = [];
    dropObject.push(`
                    <option value="0">No Spool Selected</option>
                `)
    spools.Spool.forEach(spool => {
        let profileId = null;
        if(profiles.filamentManager){
            profileId = _.findIndex(profiles.profiles, function (o) {

                return o.profile.index == spool.spools.profile;
            });
        }else{
            profileId = _.findIndex(profiles.profiles, function (o) {
                return o._id == spool.spools.profile;
            });
        }
        if(spool.spools.weight - spool.spools.used > 0){
            let index = _.findIndex(selected.selected, function(o) {
                return o == spool._id;
            });
            if(index > -1){
                dropObject.push(`
                    <option value="${spool._id}" disabled>${spool.spools.name} (${spool.spools.weight - spool.spools.used}g) - ${profiles.profiles[profileId].profile.material}</option>
                `)
            }else{
                dropObject.push(`
                    <option value="${spool._id}">${spool.spools.name} (${spool.spools.weight - spool.spools.used}g) - ${profiles.profiles[profileId].profile.material}</option>
                `)
            }

        }

    })
    return dropObject
}

export async function selectFilament(printerId, spoolId){
    let data = {
        printerId: printerId,
        spoolId: spoolId
    }
    console.log(data)
    let changedFilament = await OctoFarmclient.post("filament/select", data)
}

