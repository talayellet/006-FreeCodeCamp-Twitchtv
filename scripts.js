// Global variables
var globalData;
var globalCounter = 0;
var activeTab = 'all';

fGetChannelsData = function (path) {
    $.getJSON( path, function( data ) {
        globalData = data; // Get offline data
        fGetStreamData(); // Get stream data
    });
}

fGetStreamData = function () {
    for (var property in globalData) {
        if (globalData.hasOwnProperty(property)) {
            $.getJSON(globalData[property].url, fSetGlobalData);
        }
    }
}

// If channel is online, get its data from associated stream. Otherwise - get its associated offline data
fSetGlobalData = function (data) {
    // console.log(data); //DEBUG

    globalCounter++;
    // online channel
    if (data.stream !== null) {
        var prop = data._links.channel;
        globalData[prop].onlineData = {};
        globalData[prop].onlineData.url = data.stream.channel.url;
        globalData[prop].onlineData.imgSrc = data.stream.channel.logo;
        globalData[prop].onlineData.imgAlt = data.stream.channel.display_name;
        globalData[prop].onlineData.info = {};
        globalData[prop].onlineData.info.game = data.stream.game;
        globalData[prop].onlineData.info.status = data.stream.channel.status;
        globalData[prop].onlineData.info.viewers = data.stream.viewers;
        globalData[prop].onlineData.info.language = data.stream.channel.broadcaster_language;
    }

    // Start building HTML once all online data has been retreived from twitchTV API
    if (globalCounter == Object.keys(globalData).length) {
        fSetHTML();
    }
}

// Create HTML from channels data, append it to the DOM, then associate it with event listeners
fSetHTML = function () {
    var channelsHTML = '';
    var currChannel = '';

    for (var property in globalData) {
        if (globalData.hasOwnProperty(property)) {
            // case online - Set
            if (globalData[property].onlineData != null) {
                currChannel = '<tr class="online"><td class="channel-img-td"><a href="' + globalData[property].onlineData.url + '" target="_blank">' + '<img class="channel-logo img-circle img-thumbnail" src="'
                    + globalData[property].onlineData.imgSrc + '" alt="' + globalData[property].onlineData.imgAlt
                    + '"></a></td><td class="channel-name text-center">' + globalData[property].name + '</td><td class="info-td text-center">'
                    + '<i id="' + globalData[property].id + '" class="fa fa-info fa-3x channel-info" aria-hidden="true" data-trigger="hover"></i></td></tr>';
            }
            // case offline - Set
            else {

                currChannel = '<tr class="offline"><td class="channel-img-td"><img class="channel-logo img-circle img-thumbnail" src="'
                    + globalData[property].imgSrc + '" alt="' + globalData[property].imgAlt
                    + '"></td><td class="channel-name text-center">' + globalData[property].name + '</td><td class="info-td text-center"></td></tr>';
            }
            // append current channel
            channelsHTML += currChannel;
        }
    }

    var output = '<table class="resultsTable" id="channelsTable"><tbody>' + channelsHTML + '</tbody></table>';
    fAppendHtml(output);
    fSetChannelsDisplay();
    fSetTabClickEventListener();
    fSetDynamicSearchEventListener();
}

fAppendHtml = function (outputHTML) {
    // append all channels
    $("#channelsDiv").append(outputHTML);

    // append online info
    for (var property in globalData) {
        if (globalData.hasOwnProperty(property)) {
            if (globalData[property].onlineData != null) {
                $("#" + globalData[property].id).popover ({
                    title: "Channel Information",
                    content: '<span>Game: </span>' + globalData[property].onlineData.info.game + '<br>'
                    + '<span>Status: </span>' + globalData[property].onlineData.info.status + '<br>'
                    + '<span>Viewers: </span>' + globalData[property].onlineData.info.viewers + '<br>'
                    + '<span>Language: </span>' + globalData[property].onlineData.info.language,
                    html: true,
                    placement: "left"
                });
            }
        }
    }
}

// Set display state, color & UX on no results
fSetChannelsDisplay = function () {
    var filter = $("#searchInput").val();
    if (filter != "") {
        filter = filter.toLowerCase();
    }

    var isOdd = true;
    var counter = 0;

    $("#channelsTable tbody tr").each(function () {
        if (fIsFilterMatch(this, filter) && fIsStateMatch(this)) {
            // set display TRUE
            $(this).css("display", "table-row");
            counter++;

            // set display color
            if (isOdd) {
                $(this).css("background-color", "lightgray");
                isOdd = false;
            } else {
                $(this).css("background-color", "transparent");
                isOdd = true;
            }
        }

        // set display FALSE
        else {
            $(this).css("display", "none");
        }
    });

    // case no channels displayed (toggle)
    if (counter == 0) {
        $("#messageDiv").css("display", "block");
    } else {
        $("#messageDiv").css("display", "none");
    }
}

fIsStateMatch = function (channel) {
    // case NO state filter
    if (activeTab == "all") {
        return true;
    }

    // case active state filter
    if ($(channel).attr("class") == activeTab) {
        return true;
    } else {
        return false;
    }
}

fIsFilterMatch = function (channel, filter) {
    // Case NO filter
    if (filter == "") {
        return true;
    }

    // Case active filter
    else {
        var channelName = ($($(channel).find(".channel-name")).text()).toLowerCase();
        return channelName.includes(filter);
    }
}

fSetTabClickEventListener = function () {
    // case show all channels
    $("#allTab").click(function () {
        activeTab = "all";
        fSetChannelsDisplay();
    });

    // case show online channels
    $("#onlineTab").click(function () {
        activeTab = "online";
        fSetChannelsDisplay();
    });

    // case show offline channels
    $("#offlineTab").click(function () {
        activeTab = "offline";
        fSetChannelsDisplay();
    });
}

fSetDynamicSearchEventListener = function () {
    $("#searchInput").on("input propertychange", fSetChannelsDisplay);
}

$(document).ready(function () {
    fGetChannelsData("globalData.json");
});