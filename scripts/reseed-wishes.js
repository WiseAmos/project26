const fetch = require('node-fetch');

const COLORS = {
    GREY: '#808080',
    BLUE: '#A4C2F4',
    RED: '#E06666',
    BLACK: '#000000'
};

const WISHES = {
    [COLORS.GREY]: [
        "I typed 'I still love you' and deleted it 50 times.",
        "I almost sent you a song today, but realized I'm not that person to you anymore.",
        "The draft folder is full of your name.",
        "I wanted to say I'm sorry, but I'm afraid you won't care.",
        "I saw something funny and reached for my phone, then stopped.",
        "I still check your profile to see if you're happy. I hope you are.",
        "I typed 'I miss us' but deleted it because there is no us.",
        "Happy Birthday. I didn't send it, but I whispered it.",
        "I'm proud of you. I wish I could tell you that.",
        "I dreamt of you again. I woke up crying.",
        "You were the best thing that ever happened to me.",
        "I deleted the text, but I didn't delete the feeling.",
        "I wish I had the courage to hit send.",
    ],
    [COLORS.BLUE]: [
        "If I had one more chance, I would have stayed that night.",
        "I regret not fighting for us when it got hard.",
        "I should have listened when you said you were drowning.",
        "I wish I hadn't been so proud. Apologizing costs nothing.",
        "I regret making you feel small so I could feel big.",
        "I would have chosen you over my career if I knew it would feel this empty.",
        "I wish I had hugged you tighter the last time I saw you.",
        "I regret not telling you I loved you when I had the chance.",
        "I would have been kinder. Just kinder.",
        "I regret taking you for granted until you left.",
        "I wish I had asked 'how are you' and waited for the answer.",
        "I regret letting my fear ruin the best thing I ever had.",
        "I should have bought you flowers.",
    ],
    [COLORS.RED]: [
        "I look for your face in every crowd. It’s exhausting.",
        "I miss you so much it physically hurts my chest.",
        "I love you, and I can't tell anyone because of him.",
        "You’re the only person I want to talk to, and the only person I can't.",
        "I wonder if you ever think of me when you hear our song.",
        "Every time my phone buzzes, I hope it's you.",
        "I miss the person I was when I was with you.",
        "I love you enough to let you go, but I miss you enough to want you back.",
        "You are strictly off limits, but you are the only thing I crave.",
        "I pretend to be your friend, but I'm dying inside.",
        "My heart jumps every time I see your name.",
        "I’m still waiting for you. I know it’s stupid.",
        "I wish we met in a different life where it wasn't complicated.",
    ],
    [COLORS.BLACK]: [
        "You left without a word, so here is my goodbye: I forgive you.",
        "I'm finally deleting your number. Goodbye.",
        "You taught me that I can survive being abandoned.",
        "This is the last tear I shed for you.",
        "Goodbye to the future we planned but never lived.",
        "I am letting go of the hope that you will come back.",
        "You didn't give me closure, so I'm creating it.",
        "I release you. You are no longer my burden.",
        "Goodbye. I hope you find what you're looking for.",
        "I’m done waiting for an apology that will never come.",
        "You are a chapter, not the whole story. The page turns now.",
        "This is me walking away. For real this time.",
        "I was worth more than how you treated me. Goodbye.",
    ]
};

async function seed() {
    console.log("Seeding Wishes...");

    for (const [color, wishes] of Object.entries(WISHES)) {
        console.log(`Sending ${wishes.length} wishes for color ${color}...`);
        try {
            const res = await fetch('http://localhost:3000/api/admin/import-wishes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wishes, color })
            });
            const data = await res.json();
            console.log(`Success: ${JSON.stringify(data)}`);
        } catch (e) {
            console.error(`Error: ${e}`);
        }
    }
}

seed();
