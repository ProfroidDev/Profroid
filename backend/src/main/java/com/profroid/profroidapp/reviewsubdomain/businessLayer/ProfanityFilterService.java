package com.profroid.profroidapp.reviewsubdomain.businessLayer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ProfanityFilterService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProfanityFilterService.class);
    
    // English profanity words
    private static final Set<String> ENGLISH_PROFANITY = new HashSet<>(Arrays.asList(
        // F-word variations
        "fuck", "fucking", "fucked", "fucker", "fucks", "fuckface", "fuckhead",
        "motherfuck", "motherfucker", "motherfucking", "fucktard", "fuckwit",
        "clusterfuck", "fuckboy", "fucknugget", "fuckstick", "fuckoff",
        "fck", "fuk", "fvck", "fuc", "fking", "fcking", "fuking",
        
        // S-word variations
        "shit", "shitty", "shitting", "shits", "bullshit", "shithead", "shitface",
        "shitstorm", "shithole", "dipshit", "jackshit", "chickenshit", "horseshit",
        "apeshit", "batshit", "shitbag", "shitshow", "crappy", "crap",
        "sht", "shyt", "sh1t",
        
        // B-word variations
        "bitch", "bitches", "bitching", "bitchy", "biatch", "bish",
        "son of a bitch", "soab", "sob", "biotch",
        
        // Sexual/Anatomical terms
        "dick", "dickhead", "dickface", "dicks", "dickwad", "dickweed", "dck",
        "pussy", "pussies", "puss", "psy",
        "cock", "cocks", "cocksucker", "cocksucking", "cocker",
        "penis", "penises", "vagina", "vaginas",
        "cunt", "cunts", "kunt", "cnt",
        "twat", "twats",
        "asshole", "assholes", "ass", "arse", "arsehole", "azz", "a55",
        "tits", "titties", "boobs", "boobies", "breasts", "tit",
        "ballsack", "balls", "bollocks", "testicles", "scrotum", "nutsack",
        "butthole", "anus", "rectum",
        
        // Insults and slurs
        "bastard", "bastards", "bstrd", "batard",
        "prick", "pricks", "prik",
        "jerk", "jerks", "jerkoff", "jerkass",
        "douche", "douchebag", "douchebags", "douchebaggery", "douch",
        "moron", "idiot", "imbecile", "idiots", "morons",
        "retard", "retarded", "tard", "rtard",
        "stupid", "dumb", "dumbass", "dumbfuck", "dumbo",
        "loser", "losers",
        "wanker", "wankers", "wank", "wanking",
        "tosser", "tossers",
        "knobhead", "knob", "bellend",
        "jackass", "numbnuts", "nimrod", "schmuck", "putz",
        "scumbag", "scum", "filth", "trash", "garbage",
        "git", "minger", "munter", "slag", "slags",
        
        // Racial slurs
        "coon", "coons", "chink", "chinks", "gook", "gooks",
        "spic", "spics", "spick", "wetback", "beaner", "beaners",
        "kike", "kyke", "kikes", "towelhead", "raghead",
        "cracker", "crackers", "whitey", "honky",
        
        // Homophobic slurs
        "fag", "faggot", "fags", "faggots", "fgt", "fagot",
        "dyke", "dykes", "dike",
        "queer", "queers",
        "tranny", "trannies", "shemale", "heshe",
        "homo", "homos", "homosexual", "poof", "poofter",
        
        // Sexual acts and terms
        "slut", "sluts", "slutty", "slt",
        "whore", "whores", "whor", "hore",
        "prostitute", "hooker", "harlot",
        "skank", "skanks", "skanky", "skankass",
        "tramp", "tramps",
        "blowjob", "bj", "handjob", "hj",
        "anal", "anus", "butt sex",
        "rape", "raping", "rapist", "raper",
        "molest", "molestation", "molester",
        "pedophile", "pedo", "pedos", "paedophile",
        
        // Bodily functions
        "piss", "pissed", "pissing", "pisses", "pee", "urinate",
        "pissoff", "pissant",
        "turd", "turds", "dump", "dumps",
        
        // Religious
        "damn", "damned", "dammit", "damnit", "dang",
        "goddamn", "goddammit", "goddam", "goddamnit",
        "hell", "hells", "hellish", "helluva",
        "jesus christ", "christ", "jeez", "geez",
        
        // Misc vulgar
        "bloody", "bleeding", "blimey",
        "bugger", "buggering", "buggered",
        "sod", "sodding", "sodoff",
        "pisshead", "shithead", "dickhead",
        
        // Abbreviations and leetspeak
        "wtf", "stfu", "stf", "gtfo", "kys", "fml", "bs",
        "milf", "dilf", "gilf",
        "af", "mf", "mofo",
        "smh", "omfg",
        "a$$", "a55", "sh!t", "fuk", "fuq",
        "b1tch", "d1ck", "p1ss", "cnt", "kunt"
    ));
    
    // French profanity words
    private static final Set<String> FRENCH_PROFANITY = new HashSet<>(Arrays.asList(
        // Core swear words
        "merde", "merdes", "merdeux", "merdeuse", "merdique", "merdier",
        "putain", "putains", "pute", "putes", "putasse",
        "bordel", "bordels",
        "chier", "chiant", "chiante", "chiants", "chieur", "chieuse",
        "foutre", "foutoir", "foutu", "foutue",
        
        // Insults - con family
        "con", "connard", "connards", "connasse", "connasses", "conne", "cons",
        "connerie", "conneries", "connard", "conard",
        
        // Insults - salaud family
        "salaud", "salauds", "salopard", "salopards", "salope", "salopes", "saloperie",
        "saligaud", "saligauds",
        
        // Insults - enculé family
        "enculé", "enculés", "enculée", "enculées", "enculer", "encule",
        "enculeur", "enculeuse",
        
        // Insults - enfoiré family
        "enfoiré", "enfoirés", "enfoirée", "enfoirées", "enfoirage",
        
        // Body parts
        "bite", "bites", "queue", "queues",
        "couille", "couilles", "couillon", "couillons",
        "cul", "culs", "trou du cul",
        "chatte", "chattes", "teub", "teube",
        "nichons", "nichon", "seins",
        "foufoune", "moule", "moules",
        
        // Sexual acts
        "baiser", "baise", "baises",
        "nique", "niquer", "niquée", "niqué", "niquez",
        "branler", "branleur", "branleuse", "branlette",
        "sucer", "suce", "suceur", "suceuse",
        
        // Annoying/bothering
        "emmerder", "emmerdeur", "emmerdeuse", "emmerdant", "emmerde",
        "faire chier", "tu me fais chier",
        "casse couilles", "casse-couilles", "cassecouilles",
        "gonfler", "gonflant", "gonflante",
        
        // Abbreviations and slang (VERY COMMON)
        "fdp", "ntm", "pd", "pdp", "tg", "ftg", "vtf", "vdm", "jsp",
        "ta race", "nique ta mere", "nique ta race", "ta mere", "tmtc",
        "osef", "nik", "nk", "niquez vos meres", "nvm",
        "tpk", "ptn", "ptdr", "lol", "mdr",
        
        // LGBTQ+ slurs
        "pédé", "pede", "pédés", "pedes",
        "tapette", "tapettes", "tarlouze", "tarlouzes",
        "gouine", "gouines", "gouinasse",
        "travelo", "travelos",
        
        // Mental/physical insults
        "crétin", "crétins", "crétine", "crétines",
        "abruti", "abrutis", "abrutie", "abruties",
        "imbécile", "imbecile", "imbéciles", "imbeciles",
        "débile", "debile", "débiles", "debiles", "debilite",
        "taré", "tarée", "tarés", "tarees", "tare",
        "mongol", "mongolien", "mongolienne", "mongols",
        "attardé", "attardée", "attardés", "attarde",
        "trisomique", "autiste",
        "handicapé", "handicape",
        
        // Racist slurs
        "bamboula", "bamboulas",
        "bicot", "bicots", "bougnoule", "bougnoules",
        "nègre", "negre", "nègres", "negres",
        "youpin", "youpins", "youtre", "youtres",
        "raton", "ratons", "bougnoule",
        "crouille", "crouilles",
        
        // Multi-word phrases (common expressions)
        "fils de pute", "ta gueule", "ferme ta gueule",
        "va te faire foutre", "va chier", "va te faire enculer",
        "je t'emmerde", "tu me fais chier",
        "va niquer ta mere", "nique ta mere la pute",
        "ta mere la pute", "fils de chien",
        "espece de", "espèce de",
        "le cul", "mon cul",
        
        // Additional vulgar terms
        "ordure", "ordures", "pourriture", "pourritures",
        "raclure", "raclures", "racaille", "racailles",
        "batard", "batarde", "bâtard", "bâtarde",
        "fumier", "fumiers",
        "charogne", "charognes",
        "vermine", "vermines",
        "déchet", "déchets",
        
        // Sexual terms
        "prostitué", "prostituée", "prostituées",
        "pétasse", "pétasses", "petasse",
        "garce", "garces", "chienne", "chiennes",
        "trainée", "traînée", "trainee",
        "catin", "catins",
        
        // Body functions
        "pisser", "pisse", "pisses",
        "gerber", "gerbe", "dégueulasse", "degueulasse",
        "vomir", "vomi", "vomis",
        
        // Misc vulgar
        "zob", "zobs", "zgeg",
        "tepu", "tebé", "tebe",
        "bouffon", "bouffons", "bouffonne",
        "tocard", "tocards", "tocarde",
        "baltringue", "baltringues",
        "boloss", "bolos",
        "cassos", "crasseux",
        "clodo", "clochard",
        "lopette", "lopettes",
        "minable", "minables",
        "pourri", "pourrie", "pourris",
        
        // Variations and common misspellings
        "niker", "nike", "niké",
        "encule", "ankul", "ankuler",
        "bataclan", "sale", "salaud",
        "fdputain", "putainde", "bordelde"
    ));
    
    // Combine all profanity words
    private final Set<String> allProfanity;
    
    // Patterns to detect obfuscated profanity (e.g., "f*ck", "sh!t", "a$$")
    private final List<Pattern> obfuscationPatterns;
    
    public ProfanityFilterService() {
        // Combine English and French profanity
        allProfanity = new HashSet<>();
        allProfanity.addAll(ENGLISH_PROFANITY);
        allProfanity.addAll(FRENCH_PROFANITY);
        
        // Create patterns to detect obfuscated profanity
        obfuscationPatterns = allProfanity.stream()
            .map(this::createObfuscationPattern)
            .collect(Collectors.toList());
    }
    
    /**
     * Check if the given text contains profanity
     * @param text The text to check
     * @return true if profanity is detected, false otherwise
     */
    public boolean containsProfanity(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        
        String normalizedText = normalizeText(text);
        
        // Check for exact matches (word boundaries)
        for (String profanity : allProfanity) {
            String pattern = "\\b" + Pattern.quote(profanity) + "\\b";
            if (Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(normalizedText).find()) {
                logger.warn("Profanity detected: {}", profanity);
                return true;
            }
        }
        
        // Check for obfuscated versions
        for (Pattern pattern : obfuscationPatterns) {
            if (pattern.matcher(normalizedText).find()) {
                logger.warn("Obfuscated profanity detected");
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get list of profanity words found in the text
     * @param text The text to check
     * @return List of profanity words found
     */
    public List<String> findProfanity(String text) {
        List<String> foundProfanity = new ArrayList<>();
        
        if (text == null || text.trim().isEmpty()) {
            return foundProfanity;
        }
        
        String normalizedText = normalizeText(text);
        
        for (String profanity : allProfanity) {
            String pattern = "\\b" + Pattern.quote(profanity) + "\\b";
            if (Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(normalizedText).find()) {
                foundProfanity.add(profanity);
            }
        }
        
        return foundProfanity;
    }
    
    /**
     * Censors profanity in the text by replacing it with asterisks
     * @param text The text to censor
     * @return Censored text
     */
    public String censorProfanity(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        
        String result = text;
        
        for (String profanity : allProfanity) {
            String pattern = "\\b" + Pattern.quote(profanity) + "\\b";
            String replacement = "*".repeat(profanity.length());
            result = result.replaceAll("(?i)" + pattern, replacement);
        }
        
        return result;
    }
    
    /**
     * Normalize text by removing accents and special characters
     */
    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        
        String normalized = text;
        
        // Replace common leetspeak/number substitutions FIRST
        normalized = normalized.replaceAll("0", "o");
        normalized = normalized.replaceAll("1", "i");
        normalized = normalized.replaceAll("3", "e");
        normalized = normalized.replaceAll("4", "a");
        normalized = normalized.replaceAll("5", "s");
        normalized = normalized.replaceAll("7", "t");
        normalized = normalized.replaceAll("8", "b");
        normalized = normalized.replaceAll("@", "a");
        normalized = normalized.replaceAll("\\$", "s");
        normalized = normalized.replaceAll("\\!", "i");
        normalized = normalized.replaceAll("\\+", "t");
        
        // Remove common separators that might be used to bypass filter
        normalized = normalized.replaceAll("[_\\-\\*\\.\\s]+", " ");
        
        // Remove accents (for French words) - both lowercase and uppercase
        // Lowercase accents
        normalized = normalized.replace('é', 'e');
        normalized = normalized.replace('è', 'e');
        normalized = normalized.replace('ê', 'e');
        normalized = normalized.replace('ë', 'e');
        normalized = normalized.replace('à', 'a');
        normalized = normalized.replace('â', 'a');
        normalized = normalized.replace('ä', 'a');
        normalized = normalized.replace('ù', 'u');
        normalized = normalized.replace('û', 'u');
        normalized = normalized.replace('ü', 'u');
        normalized = normalized.replace('ï', 'i');
        normalized = normalized.replace('î', 'i');
        normalized = normalized.replace('ô', 'o');
        normalized = normalized.replace('ö', 'o');
        normalized = normalized.replace('ç', 'c');
        
        // Uppercase accents
        normalized = normalized.replace('É', 'E');
        normalized = normalized.replace('È', 'E');
        normalized = normalized.replace('Ê', 'E');
        normalized = normalized.replace('Ë', 'E');
        normalized = normalized.replace('À', 'A');
        normalized = normalized.replace('Â', 'A');
        normalized = normalized.replace('Ä', 'A');
        normalized = normalized.replace('Ù', 'U');
        normalized = normalized.replace('Û', 'U');
        normalized = normalized.replace('Ü', 'U');
        normalized = normalized.replace('Ï', 'I');
        normalized = normalized.replace('Î', 'I');
        normalized = normalized.replace('Ô', 'O');
        normalized = normalized.replace('Ö', 'O');
        normalized = normalized.replace('Ç', 'C');
        
        // Convert to lowercase first
        normalized = normalized.toLowerCase();
        
        // CRITICAL: Reduce repeated characters to catch bypasses like "fdpppppp" → "fdp"
        // This replaces 2+ consecutive identical characters with just 1 character
        // Examples: "shiiit" → "shit", "fuuuck" → "fuck", "fdpppp" → "fdp"
        normalized = normalized.replaceAll("(.)\\1+", "$1");
        
        return normalized.trim();
    }
    
    /**
     * Create a pattern to detect obfuscated versions of profanity
     * Example: "fuck" -> matches "f*ck", "f@ck", "fu¢k", etc.
     */
    private Pattern createObfuscationPattern(String word) {
        StringBuilder regex = new StringBuilder("\\b");
        
        for (char c : word.toCharArray()) {
            // Create character class for common substitutions
            String charPattern;
            switch (Character.toLowerCase(c)) {
                case 'a':
                    charPattern = "[a@4]";
                    break;
                case 'e':
                    charPattern = "[e3€]";
                    break;
                case 'i':
                    charPattern = "[i1!|]";
                    break;
                case 'o':
                    charPattern = "[o0]";
                    break;
                case 's':
                    charPattern = "[s$5]";
                    break;
                case 't':
                    charPattern = "[t7+]";
                    break;
                case 'l':
                    charPattern = "[l1|]";
                    break;
                case 'c':
                    charPattern = "[c¢]";
                    break;
                case 'u':
                    charPattern = "[uv]";
                    break;
                default:
                    charPattern = "[" + Character.toLowerCase(c) + Character.toUpperCase(c) + "]";
                    break;
            }
            
            regex.append(charPattern);
            // Allow optional special characters between letters
            regex.append("[*_\\-.]?");
        }
        
        regex.append("\\b");
        
        return Pattern.compile(regex.toString(), Pattern.CASE_INSENSITIVE);
    }
    
    /**
     * Validates that the text is clean (no profanity)
     * @param text The text to validate
     * @throws ProfanityException if profanity is detected
     */
    public void validateText(String text) {
        if (containsProfanity(text)) {
            List<String> foundWords = findProfanity(text);
            String message = foundWords.isEmpty() 
                ? "Your review contains inappropriate language. Please remove offensive words and try again."
                : "Your review contains inappropriate language. Please remove offensive words and try again.";
            throw new ProfanityException(message);
        }
    }
}
