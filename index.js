'use strict';

const { WebhookClient, Payload, RichResponse, PLATFORMS } = require('dialogflow-fulfillment');
const { Card, Suggestion, Text } = require('dialogflow-fulfillment');


const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise-native');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//api 호출 함수//
//query_options(service,uri,method,body,bearer_key)
//우선적으로 method도 입력 받게끔 수정함. - 박기철
function query_options(service, uri, method, body, bearer_key) {


    let options = {
        uri: uri,
        method: method,
        //qs: parameters,
        body: body,
        headers: { 'content-type': 'application/json' },
        auth: {
            bearer: bearer_key
        },
        json: true
    };

    return options;
}


function welcome(agent) {
    agent.add(`Welcome to Express.JS webhook!`);
}

function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

function simpleInGetCostMonth(agent) {

    const dateTime = agent.parameters['date-time'];
    const kindOfClouds = agent.parameters['pKindOfClouds'];
    agent.add('네, 문의하신 ' + dateTime + ' +' + kindOfClouds + ' 비용은 $30,00원 입니다. 상세 비용 확인을 원하시나요?');

    agent.add(new Suggestion('상세 비용 페이지로 이동해줘'));
}

/*  
 **author : mjw
 **desc : 비용계산
 */

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function dateFormat(x) {
    x = x.replace(/-/g, '');
    if (x.length == 6) return x.substr(0, 4) + '-' + x.substr(4, 2);
    if (x.length == 8) return x.substr(0, 4) + '-' + x.substr(4, 2) + '-' + x.substr(6, 2);
}

const session_bearer_key = '3e009689-bfc2-4fd8-a3b5-72d7475e9d70';
var getCostByTerm = function(agent) {
    const dateTime = agent.parameters['date-time']; // 기간
    const vendor = agent.parameters['vendor']; // 제품
    const account = agent.parameters['account']; // 어카운트
    const cost = agent.parameters['cost']; // 어카운트
    const monthly = agent.parameters['monthly']; // 월별
    const sort = agent.parameters['sort']; //
    const display = agent.parameters['display']; // 월별

    console.log('dateTime:' + dateTime);
    console.log('vendor:' + vendor);
    console.log('account:' + account);
    console.log('cost:' + cost);
    console.log('monthly:' + monthly);
    console.log('sort:' + sort);
    console.log('display:' + display);

    let dateArg = dateTime.substr(0, 10).replace(/-/g, '');
    if (monthly != '' && monthly != undefined) {
        dateArg = dateArg.substr(0, 6);

        return new Promise(function(resolve, reject) {
            resolve(getCostByMonthly(agent, dateArg, vendor));
        });
    } else {
        if (dateTime.indexOf("/") > -1) { // 기간으로 조회
            dateArg = dateArg.substr(0, 6);

            return new Promise(function(resolve, reject) {
                resolve(getCostByMonth(agent, dateArg, vendor));
            });
        } else { // 일자로 조회
            return new Promise(function(resolve, reject) {
                resolve(getCostByDay(agent, dateArg, vendor));
            });
        }
    }
};

//var getCostByDay = function(agent, dateArg, vendor){
//    console.log('dateArg(month):' + dateArg);
//    console.log('vendor:' + vendor);
//
//	/*요청 바디 생성 시작.*/
//    let service = 'cost'; //서비스 구분
//    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total';  //해당 인텐트 API URL
//    let bearer_key = session_bearer_key;     //해당 API 서버 토큰 값
//    let method = 'POST';
//    let body = {
//    		sitecode : 'BESPIN',
//            uid : 'c40023d3-a870-4f53-8a16-e398526286ff',
//            companyid : '1', 
//            vendorName : vendor, 
//            yyyymm : dateArg,
//            account : null
//    }
//     
//    let options = query_options(service,uri,method,body,bearer_key);
//    
//    console.log('options:' + JSON.stringify(options));
//    
//    return request(options).then(function (parsedBody) {
//    	console.log('parsedBody:' + JSON.stringify(parsedBody));
//        /* 답변 생성 */
////        agent.add('[' + dateFormat(dateArg) + '] ' + vendor + `의 비용은 $` + numberWithCommas(1250) + `입니다(예문).`);
//      agent.add('월 비용, 월별 비용만 알려드릴 수 있어요. 일 비용 조회는 OpsNow 포털을 이용하세요.');
//        return Promise.resolve( agent );
//     }).catch(function (err) {   
//    	console.log('err:', err);
//    	agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
//     });
//};

//var getCostByMonth = function(agent, dateArg, vendor){
//    console.log('dateArg(month):' + dateArg);
//    console.log('vendor:' + vendor);

var getCostByMonth = function(agent) {
    const dateTime = agent.parameters['date-time']; // 기간
    const vendor = agent.parameters['vendor']; // 제품
    const account = agent.parameters['account']; // 어카운트
    const cost = agent.parameters['cost']; // 어카운트
    const monthly = agent.parameters['monthly']; // 월별
    const sort = agent.parameters['sort']; //
    const display = agent.parameters['display']; // 월별

    console.log('month - dateTime:' + dateTime);
    console.log('month - vendor:' + vendor);
    console.log('month - account:' + account);
    console.log('month - cost:' + cost);
    console.log('month - monthly:' + monthly);
    console.log('month - sort:' + sort);
    console.log('month - display:' + display);

    let dateArg = dateTime.substr(0, 10).replace(/-/g, '');
    if (monthly != '' && monthly != undefined) {
        dateArg = dateArg.substr(0, 6);

        return new Promise(function(resolve, reject) {
            resolve(getCostByMonthly(agent, dateArg, vendor));
        });
    } else {
        if (dateTime.indexOf("/") > -1) { // 기간으로 조회
            dateArg = dateArg.substr(0, 6);

            return new Promise(function(resolve, reject) {
                resolve(getCostByMonth(agent, dateArg, vendor));
            });
        } else { // 일자로 조회
            return new Promise(function(resolve, reject) {
                resolve(getCostByDay(agent, dateArg, vendor));
            });
        }
    }

    /*요청 바디 생성 시작.*/
    let service = 'cost'; //서비스 구분
    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total'; //해당 인텐트 API URL
    let bearer_key = session_bearer_key; //해당 API 서버 토큰 값
    let method = 'POST';
    let body = {
        sitecode: 'BESPIN',
        uid: 'c40023d3-a870-4f53-8a16-e398526286ff',
        companyid: '1',
        vendorName: vendor,
        yyyymm: dateArg,
        account: null
    }

    let options = query_options(service, uri, method, body, bearer_key);

    console.log('options:' + JSON.stringify(options));

    return request(options).then(function(parsedBody) {
        console.log('parsedBody:' + JSON.stringify(parsedBody));
        /* 답변 생성 */
        let cost = parseFloat(parsedBody.Data[0].cost.toFixed(2));
        agent.add('[' + dateFormat(dateArg) + '] ' + vendor + ' ' + agent.parameters['cost'] + '은 $' + numberWithCommas(cost) + '입니다.');
        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err:', err);
        agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
    });
};

var getCostByMonthly = function(agent, dateArg, vendor) {
    console.log('dateArg(month):' + dateArg);
    console.log('vendor:' + vendor);

    /*요청 바디 생성 시작.*/
    let service = 'cost'; //서비스 구분
    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total'; //해당 인텐트 API URL
    let bearer_key = session_bearer_key; //해당 API 서버 토큰 값
    let method = 'POST';
    let body = {
        sitecode: 'BESPIN',
        uid: 'c40023d3-a870-4f53-8a16-e398526286ff',
        companyid: '1',
        vendorName: vendor,
        yyyymm: dateArg,
        account: null
    }

    let options = query_options(service, uri, method, body, bearer_key);

    console.log('options:' + JSON.stringify(options));

    return request(options).then(function(parsedBody) {
        console.log('parsedBody:' + JSON.stringify(parsedBody));
        /* 답변 생성 */
        agent.add(vendor + `의 월별 비용은 다음과 같습니다.`);
        agent.add(`1월의 비용: 100원`);
        agent.add(`2월의 비용: 110원`);
        agent.add(`3월의 비용: 120원`);
        agent.add(`4월의 비용: 130원`);
        agent.add(`5월의 비용: 140원`);
        agent.add(`6월의 비용: 150원....`);
        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err:', err);
        agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
    });
};

var getCostByYear = function(agent) {
    const dateTime = agent.parameters['date-time']; // 기간
    const vendor = agent.parameters['vendor']; // 제품
    const account = agent.parameters['account']; // 어카운트
    const cost = agent.parameters['cost']; // 어카운트
    const monthly = agent.parameters['monthly']; // 월별
    const sort = agent.parameters['sort']; //
    const display = agent.parameters['display']; // 월별

    console.log('year - dateTime:' + dateTime);
    console.log('year - vendor:' + vendor);
    console.log('year - account:' + account);
    console.log('year - cost:' + cost);
    console.log('year - monthly:' + monthly);
    console.log('year - sort:' + sort);
    console.log('year - display:' + display);

    let dateArg = dateTime.replace(/-/g, '');
    let sDate = '';
    let eDate = '';
    if (dateTime.indexOf("/") > -1) {
        sDate = dateArg[0];
        eDate = dateArg[1];
    }

    /*요청 바디 생성 시작.*/
    let service = 'cost'; //서비스 구분
    let uri = 'https://meteringdev.opsnow.com/MAZ/chatbot/cost/total'; //해당 인텐트 API URL
    let bearer_key = session_bearer_key; //해당 API 서버 토큰 값
    let method = 'POST';
    let body = {
        sitecode: 'BESPIN',
        uid: 'c40023d3-a870-4f53-8a16-e398526286ff',
        companyid: '1',
        vendorName: vendor,
        yyyymm: '201811',
        account: null
    }
    let options = query_options(service, uri, method, body, bearer_key);
    console.log('options:' + JSON.stringify(options));

    return request(options).then(function(parsedBody) {
        console.log('parsedBody:' + JSON.stringify(parsedBody));
        /* 답변 생성 */
        let cost = parseFloat(parsedBody.Data[0].cost.toFixed(2));
        //    	agent.add('[' + dateFormat(dateArg) +'] ' + vendor + ' ' + agent.parameters['cost'] + '은 $'+ numberWithCommas(cost) +'입니다.');
        agent.add('[' + dateTime + '] 1년간 ' + vendor + ' ' + agent.parameters['cost'] + '은 $' + numberWithCommas(cost) + '입니다(예문).');
        return Promise.resolve(agent);
    }).catch(function(err) {
        console.log('err:', err);
        agent.add('값이 없습니다. 요청사항을 확인해 주세요.');
    });
};
//
var simpleInGetIncidentList = function(agent) {

    agent.add(`인시던트 리스트를 보여드리겠습니다.`);

    /*요청 바디 생성 시작.*/
    let service = 'alertnow'; //서비스 임의 구분함. asset, cost, alertnow
    let uri = 'https://alertnowextapidqa.opsnow.com/chatbot/v1/1/incident'; //해당 인텐트 API URL
    let bearer_key = 'b5e9b69f-6612-4ef8-bb36-397370f35339'; //해당 API 서버 토큰 값

    let parameters = {
        uid: '58dbd0c2-931a-4504-80c8-76edfcf3e45d',
        sitecode: 'BESPIN',
        startDt: '2018-11-22 00:00:00',
        endDt: '2018-11-23 23:59:59'
    }

    let options = query_options(service, uri, parameters, bearer_key);
    /*요청 바디 생성 끝.*/



    /* API request 요청 */
    return request(options).then(function(parsedBody) {

        /* 답변 생성 ,*/
        agent.add('네, 인시던트 리스트 티켓 넘버는 ' + parsedBody.result[0].tcktNo + '입니다.');

        return Promise.resolve(agent);

    }).catch(function(err) {
        console.log('err', err);
    });
    /* API request 끝 */


};

//
var simpleInGetCostdaily = function(agent) {

    const request = require('request-promise-native');
    const url = "https://api.site.com/sub?query=";

    agent.add(`일별 비용을 보여드리겠습니다. :`);

    return request.get('http://13.209.65.23:8080/customer')
        .then(jsonBody => {
            var body = JSON.parse(jsonBody);
            agent.add(new Card({
                title: body[0].username + `님의 일별 비용 `,
                text: body[0].dailycost + '원, 현재까지 사용한 결과입니다. ',
                buttonText: '자세히 보기',
                buttonUrl: 'http://hello.com'
            }));
            return Promise.resolve(agent);
        });

};

//   
function getServiceDesc(agent) {


}

//
function slotInGetServerStatus(agent) {

    const kindOfClouds = agent.parameters['pKindOfClouds'];

    if (kindOfClouds) {
        agent.add('전체 12대 ' + kindOfClouds + ' 서버의 CPU 사용률은 평균 98%, 메모리는 70%를 사용하고 있고, 서버별 사용률 편차는 65% 입니다. <enter> SEOUL-A-PRD-LIGHTSABER-NOTIFICATION-BATCH01 의 하드웨어 사용률이 높습니다. 지금 바로 확인하세요!');

        const googlePayloadJson_graph = {
            "type": "graph_bar",
            "platform": "google",
            "title": "서버 상태",
            "subtitle": "aws1 sub"
        };

        let payload = new Payload('ACTIONS_ON_GOOGLE', {});
        payload.setPayload(googlePayloadJson_graph);
        agent.add(payload);
    }

}


function slotInGetTotalServerPerfomance(agent) {


    agent.add('지난 한달(2018.09.20~2018.10.18) EC2서버 CPU, Memory, Disk 사용량 데이터를 분석한 결과, 10월 16일, 10월 18일 CPU 사용량이 한달 평균 표준편차의 30%이상 높습니다. 확인하시기 바랍니다.');
    agent.add('옵스나우 Asset Management 의 Performance 메뉴에서 전체 서버 성능을 확인할 수 있습니다.');

    const googlePayloadJson_graph = {
        "type": "graph_anal",
        "platform": "google",
        "title": "전체 서버 성능",
        "subtitle": "aws1 sub"
    };

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);

}


function slotInGetDatabaseStatus(agent) {
    const kindOfClouds = agent.parameters['pKindOfClouds'];
    const time = agent.parameters['time'];

    agent.add('현재 ' + kindOfClouds + '데이터베이스의 평균 CPU 24%, 메모리는 70%를 사용하고 있습니다. 지금 바로 확인하세요!');

    agent.add(new Card({
        title: 'Asset Management - Performance',
        imageUrl: 'https://www.opsnow.com/assets/images/am_info_img01.png',
        text: '클라우드 서버의 CPU, 메모리, 디스크 사용률을 확인할 수 있습니다.',
        buttonText: '상세 페이지 이동',
        buttonUrl: 'https://asset.opsnow.com/#/performance/current'
    }));


}


function slotInGetDiskStatus(agent) {
    const kindOfClouds = agent.parameters['pKindOfClouds'];
    const time = agent.parameters['time'];

    agent.add('현재 ' + kindOfClouds + '서버의 디스크 사용률은 전체 480/540GB 사용중입니다.평균 88% 사용하고 있습니다. 지금 바로 확인하세요!');
    agent.add(new Card({
        title: 'Asset Management - Performance',
        imageUrl: 'https://www.opsnow.com/assets/images/am_info_img01.png',
        text: '클라우드 서버의 CPU, 메모리, 디스크 사용률을 확인할 수 있습니다.',
        buttonText: '상세 페이지 이동',
        buttonUrl: 'https://asset.opsnow.com/#/performance/current'
    }));

}

function simpleInGetAssetList(agent) {

    //   const dateTime = agent.parameters['date-time'];
    //  const kindOfAddOrDelete = agent.parameters['kindOfAddOrDelete'];
    //  const kindOfPastPeriod = agent.parameters['kindOfPastPeriod'];
    //const rs = agent.requestSource;
    //const os = agent.originalRequest;
    /*
        const googlePayloadJson = { 
            expectUserResponse: true, 
            isSsml: false,  
              
            noInputPrompts: [], 
            richResponse: { items: [{ simpleResponse: { textToSpeech: 'hello', displayText: 'hi' } }] }, 
            systemIntent: { intent: 'actions.intent.OPTION', } 
            
        } ;
      */
    /*
       const googlePayloadJson = { 
       "messages": 
          {
            "type": "simple_response",
            "platform": "google",
            "textToSpeech": "전체 클라우드 98개 Resource 에서 미사용 목록 2건이 검색되었습니다. 옵스나우 Asset Management 의 Resource Optimization 에서 다음 목록을 통해 예상 절감 금액 및 예상 증가 금액을 확인할 수 있습니다."
          }
      } ;
      */
    /*
        const googlePayloadJson =
          {
              
              "type": "list_card",
              "platform": "google",
              "title": "자산 내역 리스트",
              "subtitle": "aws1 sub",
              "items": [
                {
                  "optionInfo": {
                    "key": "key1",
                    "synonyms": []
                  },
                  "title": "AWS EC2 (50)",
                  "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 1"
                  }
                },
                {
                  "optionInfo": {
                    "key": "key2",
                    "synonyms": []
                  },
                  "title": "AWS ELB (28)",
                  "image": {
                    "url": "http://www.boylesoftware.com/blog/wp-content/uploads/2015/04/checkmark.png",
                    "accessibilityText": "item image access 2"
                  }
                }
              ]

          };
             const googlePayloadJson_graph =
          {
              "type": "graph_pie",
              "platform": "google",
              "title": "자산 내역",
              "subtitle": "aws1 sub",
          };
        //  googlePayloadJson.messages.push(googlePayloadJson_graph);
        //    agent.requestSource = 'ACTIONS_ON_GOOGLE';
        //agent.add(new Payload('ACTIONS_ON_GOOGLE', googlePayloadJson )); 
     // agent.requestSource = 'ACTIONS_ON_GOOGLE';

        let payload = new Payload('ACTIONS_ON_GOOGLE', {}); 
        payload.setPayload(googlePayloadJson);
        agent.add(payload);

    */

    //  googlePayloadJson.messages.push(googlePayloadJson_graph);
    //    agent.requestSource = 'ACTIONS_ON_GOOGLE';
    //agent.add(new Payload('ACTIONS_ON_GOOGLE', googlePayloadJson )); 
    // agent.requestSource = 'ACTIONS_ON_GOOGLE';


    const kindOfAddOrDelete = agent.parameters['kindOfAddOrDelete'];
    const kindOfPastPeriod = agent.parameters['kindOfPastPeriod'];
    const itsAll = agent.parameters['itsAll'];
    if (itsAll) {
        agent.add('전체 자산내역을 확인하고 싶으신가요? <enter> 총 54개의 자원을 현재 사용중이고, 해당 내역은 다음과 같습니다.');

    } else if (kindOfPastPeriod !== null && kindOfAddOrDelete !== null) {
        agent.add(kindOfPastPeriod + ' ' + kindOfAddOrDelete + '자산내역을 확인하고 싶으신가요? <enter> 해당 내역은 다음과 같습니다.');

    } else {
        agent.add('전체 자산내역을 보여드리겠습니다. <enter> 총 54개의 자원을 현재 사용중이고, 해당 내역은 다음과 같습니다.');

    }

    const googlePayloadJson_graph = {

        "type": "graph_pie",
        "platform": "google",
        "title": "서버 상태",
        "subtitle": "aws1 sub"

    };

    /*
        [
        {
          "type": "simple_response",
          "platform": "google",
          "textToSpeech": "혹시 옵스나우 이용에 불편이 있으셨나요? 옵스나우 지원센터에서 서비스 담당자들에게 직접 질문을 등록하고 답변을 받을 수 있습니다."
        },
        {
          "type": "simple_response",
          "platform": "google",
          "textToSpeech": "가끔은 저도 제 고민을 들어줄 사람이 있으면 좋겠네요.."
        },
        {
          "type": "link_out_chip",
          "platform": "google",
          "destinationName": "상담/문의",
          "url": "https://support.opsnow.com/hc/ko/requests/new"
        },
        
    */

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);



    // agent.add('현재 자산내역은 다음과 같습니다.');


    agent.add(new Suggestion(
        '자산 내역 페이지로 이동해줘'
    ));
}



function simpleInCheckMyPlan(agent) {

    /*
         const city = agent.parameters['geo-city'];
     const time = agent.parameters['time'];
     const gotCity = city.length > 0;
     const gotTime = time.length > 0;

     if(gotCity && gotTime) {
         agent.add(`Nice, you want to fly to ${city} at ${time}.`);
     } else if (gotCity && !gotTime) {
         agent.add('Let me know which time you want to fly');
     } else if (gotTime && !gotCity) {
         agent.add('Let me know which city you want to fly to');
     } else {
         agent.add('Let me know which city and time you want to fly');
     }
       */

}



function simpleInGetCostOptimization(agent) {

    agent.add('옵스나우는 Usage, Performace, Cost 분석을 통해 RI 구매, 혹은 Right Sizing 이 필요한 Instance 들을 추천하는 기능을 제공하고 있습니다!. <enter>그리고 필요한 항목만을 검색할 수 있는 Intelligent Search 를 사용해보세요! ');

    const googlePayloadJson_graph = {

        "type": "graph_cost_anal",
        "platform": "google",
        "title": "비용 분석",
        "subtitle": "aws1 sub"

    };
    agent.add('저도 간단하지만 강력한 비용 분석을 할 수 있어요! 저에게 고객님의 비용 분석을 맡겨보시겠어요?');

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);

    agent.add(new Suggestion('상세 비용 페이지로 이동해줘'));
}


function simpleInGetCostMonth(agent) {
    //graph_cost_anal

    const dateTime = agent.parameters['date-time'];
    const kindOfClouds = agent.parameters['pKindOfClouds'];

    agent.add('네, 문의하신 ' + dateTime + ' +' + kindOfClouds + ' 비용은 $30,00원 입니다. 상세 비용 확인을 원하시나요?');


    agent.add(new Suggestion(
        '상세 비용 페이지로 이동해줘'
    ));

}


function simpleInGetCostMonthly(agent) {

    agent.add('네, 월별로 전체 금액을 보여드릴게요! ');

    const googlePayloadJson_graph = {

        "type": "graph_cost_month",
        "platform": "google",
        "title": "월별 비용",
        "subtitle": "aws1 sub"

    };

    let payload = new Payload('ACTIONS_ON_GOOGLE', {});
    payload.setPayload(googlePayloadJson_graph);
    agent.add(payload);

    agent.add('세부 항복별 비교도 준비하고 있습니다. 상세 비용을 확인하고 싶으시면 Cost Management 비용관리에서 확인하실 수 있습니다.');
    agent.add(new Suggestion('상세 비용 페이지로 이동해줘'));

}



function WebhookProcessing(request, response) {
    const agent = new WebhookClient({ request, response });
    console.info(`agent set`);
    agent.requestSource = 'ACTIONS_ON_GOOGLE';


    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    let intentMap = new Map();

    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('simple.in.getCost.month', simpleInGetCostMonth);
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('simple.out.getServiceDesc', getServiceDesc);

    //cost
    intentMap.set('simple.in.getCost.daily', simpleInGetCostdaily);
    intentMap.set('simple.in.getCost.month', simpleInGetCostMonth);

    intentMap.set('slot.in.getCostByMonth', getCostByTerm);
    intentMap.set('slot.in.getCostByYear', getCostByYear);



    //asset
    intentMap.set('slot.in.getServer.status', slotInGetServerStatus);
    intentMap.set('simple.in.checkMyPlan', simpleInCheckMyPlan);
    intentMap.set('slot.in.getTotalServer.perfomance', slotInGetTotalServerPerfomance);
    intentMap.set('slot.in.getDisk.status', slotInGetDiskStatus);
    intentMap.set('slot.in.getDatabase.status', slotInGetDatabaseStatus);
    intentMap.set('simple.in.getAsset.list', simpleInGetAssetList);


    //alertnow
    intentMap.set('simple.in.getIncident.list', simpleInGetIncidentList);
    intentMap.set('simple.in.getCostOptimization', simpleInGetCostOptimization);

    agent.handleRequest(intentMap);
}


// Webhook
app.post('/', function(request, response) {
    console.info(`\n\n>>>>>>> S E R V E R   H I T <<<<<<<`);
    WebhookProcessing(request, response);
});

app.listen(8093, function() {
    console.info(`Webhook listening on port 8093!`)
});