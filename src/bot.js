// const { Telegraf } = require('telegraf')

// TOKEN = '7684929253:AAHyLYTuFPAu-RKELx2KK-aYhwcmevU7Aaw'
// const bot = new Telegraf(TOKEN)
// // const bot = new Telegraf(process.env.BOT_TOKEN)

// const web_link = "https://boredtap.netlify.app/"

// bot.start((ctx) => ctx.reply('Welcome', {
//     reply_markup: {
//         keyboard: [[{text: "Launch", web_app: {url: web_link}}]]
//     }
//     }
// ))
// bot.launch()

// bot.help((ctx) => ctx.reply('Send me a sticker'))
// bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
// bot.hears('hi', (ctx) => ctx.reply('Hey there'))

$(document).ready(function () {
    // Wait until the Telegram WebApp is ready
    const tg = window.Telegram.WebApp;

    // Get user data from Telegram
    const user = tg.initDataUnsafe.user;
    // const referral_id = tg.initDataUnsafe.start_param || "";

    $("h1").text(user.username);
    $("h2").text(user.id);
    $("h3").text(user.photo_url);
    // $("p").text(user.username);

    // Function to register the user
    async function registerUser(user) {
        const url = "https://bored-tap-api.onrender.com/sign-up";
        const data = {
            telegram_user_id: user.id,
            username: user.username,
            image_url: user.photo_url,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            $("p").text(response.staus);
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log(jsonData); // This will contain the response data from the API
        // $("p").text(user.id);
    }
    
    // $.ajax({
    //     url: "https://bored-tap-api.onrender.com/sign-up",
    //     type: "POST",
    //     data: formData,
    //     processData: false,
    //     contentType: false,
    //     success: function (data) {
    //         console.log("Fetch Success:", data); // Debugging line
    //     },
    //     error: function (jqXHR, textStatus, errorThrown) {
    //         console.log("Fetch Error:", textStatus, errorThrown); // Debugging line
    //         // alert(Error registering user:
    //         // Message: ${errorThrown}
    //         // Response Status: ${jqXHR.status || 'N/A'}
    //         // Response Text: ${jqXHR.responseText || 'N/A'});
    //     },
    // });

    // Register the user if Telegram provides the user data
    // if (user && user.id) {
    //     registerUser().catch((error) => console.error(error));
    // }
});




// // Wait until the Telegram WebApp is ready
// const tg = window.Telegram.WebApp;

// // Get user data from Telegram
// const user = tg.initDataUnsafe.user;
// // const referral_id = tg.initDataUnsafe.start_param || "";


// const userData = user.username

// let taggg = document.getElementById('1')
// // const username = user.username
// // const image_url = user.photo_url

// taggg.innerHTML = userData;

// async function fetchData() {
//     const url = 'https://bored-tap-api.onrender.com/sign-up';
//     const data = {
//       telegram_user_id: "3456789",
//       username: "test1",
//       image_url: "https://example.com/test",
//     };
  
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'accept': 'application/json',
//         'Content-Type': 'application/json',
//       },
//       body: data,
//     });
  
//     if (!response.ok) {
//       throw new Error(`Error fetching data: ${response.status}`);
//     }
  
//     const jsonData = await response.json();
//     console.log(jsonData); // This will contain the response data from the API
//   }
  
// if (user && user.id) {
//   fetchData().catch(error => console.error(error));
// }

// fetchData().catch(error => console.error(error));