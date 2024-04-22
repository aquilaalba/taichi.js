let wgsl: string[];
let originlength: number = 0;

export function declutter(wgslInput: string): string {
    originlength = wgslInput.length;
    wgsl = wgslInput.trim().split(";");

    declutterRedundantPrimitiveTypes();
    declutterRedundantAssignments();

    let wgslOut = wgsl.join(";");
    console.log(wgslOut);
    console.log("WGSL decluttered by " + ((originlength - wgslOut.length) / originlength * 100).toFixed(0) + "%");
    return wgsl.join(";");
}

function declutterRedundantPrimitiveTypes() {
    wgsl.forEach((v, k) => {
        if (v.indexOf("i32(i32(_") != -1) {
            wgsl[k] = v.replace("i32(i32(_", "i32(_");
            wgsl[k] = wgsl[k].slice(0, wgsl[k].lastIndexOf(")"));
        }
        if (v.indexOf("f32(f32(_") != -1) {
            wgsl[k] = v.replace("f32(f32(_", "(f32(_");
            wgsl[k] = wgsl[k].slice(0, wgsl[k].lastIndexOf(")"));
        }
    })
}

/**
 * Declutters following pattern:
 *  let _0_ : i32 = 0;
 *  var _1_ : i32;
 *  _1_ = _0_;
 */
function declutterRedundantAssignments() {
    const regex1 = /let _\d*_ : [fi]32 = [\w\W]*/
    const regex2 = /var _\d*_ : [fi]32/
    const regex3 = /_\d*_ = _\d*_/
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;

    // 1: Problematische Ausdrücke sichern und anpassen
    const regex4 = /_internal_temp_\d*_end/
    const regex5 = /_internal_temp_\d*_total_invocs/
    
    const pos1varresult = Math.trunc(Math.random() * 1e7).toString();
    const pos2varresult = Math.trunc(Math.random() * 1e7).toString();

    wgsl.forEach((v, k) => {
        pos1 = v.search(regex4);
        if (pos1 != -1) {
            let arr = v.split("_");
            arr[3] = pos1varresult;
            wgsl[k] = arr.join("_");
        }
        pos2 = v.search(regex5);
        if (pos2 != -1) {
            let arr = v.split("_");
            arr[3] = pos2varresult;
            wgsl[k] = arr.join("_");
        }
    })

    // 2. Nach redundanten Variablendeklarationen suchen
    wgsl.forEach((v, k) => {
        pos1 = v.search(regex1);
        if (wgsl[k + 1] != undefined) {
            pos2 = wgsl[k + 1].search(regex2);
        } else {
            return;
        }
        if (wgsl[k + 2] != undefined) {
            pos3 = wgsl[k + 2].search(regex3);
        } else {
            return;
        }

        // Hintereinander folgend?
        if (pos1 != -1 && pos2 != -1 && pos3 != -1) {
            let arr1 = v.split("_");
            let arr2 = wgsl[k + 1].split("_");
            let pos1var = "_" + arr1[1] + "_";
            let pos2var = "_" + arr2[1] + "_";

            // 2. und 3. Zeile löschen
            wgsl[k + 1] = "";
            wgsl[k + 2] = "";
            
            // Alle pos2var Variablen auf pos1var umlenken
            wgsl.forEach((v2, k2) => {
                wgsl[k2] = v2.replace(pos2var, pos1var);
            });

            // let durch var ersetzen
            wgsl[k] = wgsl[k].replace("let", "var");
        }
    })

    // Array um leere Zeilen bereinigen
    //let arr: string[];
    wgsl = wgsl.filter(e => e.length > 0);
}