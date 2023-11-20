// fetchTables.js

function fetchTablesGet(statName, tablename) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: `/update_database?stat=${statName}&table=${tablename}`,
            contentType: 'application/json;charset=UTF-8',
            success: function (response) {
                console.log('Success response:', response);
                if (response.status === 'success') {
                    if (Array.isArray(response.data)) {
                        resolve(response.data);
                    } else {
                        resolve([response.data]);
                    }
                } else {
                    console.error('Error response:', response);
                    reject('Error: ' + response.message);
                }
            },
            error: function (error) {
                console.error('Error:', error);
                reject('Error: ' + error.statusText);
            }
        });
    });
}


function fetchTablesPost(statName, value, tablename) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: `/update_database?stat=${statName}&value=${value}&table=${tablename}`,
            contentType: 'application/json;charset=UTF-8',
            success: function (response) {
                console.log(response);
                if (response.status === 'success') {
                    resolve({ value: response.value });
                } else {
                    reject(response);
                }
            },
            error: function (error) {
                console.error('Error:', error);
                reject(error);
            }
        });
    });
}


















// function fetchTables(requestType, statName, value) {
//     return new Promise(function (resolve, reject) {
//         $.ajax({
//             type: requestType,
//             url: '/update_database',
//             contentType: 'application/json;charset=UTF-8',
//             data: JSON.stringify({
//                 stat: statName,
//                 value: value
//             }),
//             success: function (response) {
//                 console.log(response);
//                 if (response.status === 'success') {
//                     resolve(response.value);
//                 } else {
//                     reject(response);
//                 }
//             },
//             error: function (error) {
//                 console.error('Error:', error);
//                 reject(error);
//             }
//         });
//     });
// }
