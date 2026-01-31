package com.profroid.profroidapp.reviewsubdomain.businessLayer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ProfanityFilterServiceTest {

    private ProfanityFilterService profanityFilterService;

    @BeforeEach
    void setUp() {
        profanityFilterService = new ProfanityFilterService();
    }

    @Test
    void testContainsProfanity_EnglishProfanity_ReturnsTrue() {
        // Arrange
        String text = "This service is shit";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertTrue(result);
    }

    @Test
    void testContainsProfanity_FrenchProfanity_ReturnsTrue() {
        // Arrange
        String text = "Ce service est merde";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertTrue(result);
    }

    @Test
    void testContainsProfanity_CleanText_ReturnsFalse() {
        // Arrange
        String text = "Great service, very professional!";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertFalse(result);
    }

    @Test
    void testContainsProfanity_EmptyText_ReturnsFalse() {
        // Arrange
        String text = "";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertFalse(result);
    }

    @Test
    void testContainsProfanity_NullText_ReturnsFalse() {
        // Arrange
        String text = null;

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertFalse(result);
    }

    @Test
    void testContainsProfanity_ObfuscatedProfanity_ReturnsTrue() {
        // Arrange
        String text = "This is f*ck!ng terrible";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertTrue(result);
    }

    @Test
    void testFindProfanity_MultipleProfanityWords_ReturnsAll() {
        // Arrange
        String text = "This shit is fucking terrible";

        // Act
        List<String> found = profanityFilterService.findProfanity(text);

        // Assert
        assertFalse(found.isEmpty());
        assertTrue(found.size() >= 1);
    }

    @Test
    void testFindProfanity_CleanText_ReturnsEmpty() {
        // Arrange
        String text = "Great service!";

        // Act
        List<String> found = profanityFilterService.findProfanity(text);

        // Assert
        assertTrue(found.isEmpty());
    }

    @Test
    void testCensorProfanity_ContainsProfanity_ReturnsCensored() {
        // Arrange
        String text = "This shit is bad";

        // Act
        String censored = profanityFilterService.censorProfanity(text);

        // Assert
        assertNotEquals(text, censored);
        assertTrue(censored.contains("*"));
        assertFalse(censored.contains("shit"));
    }

    @Test
    void testCensorProfanity_CleanText_ReturnsUnchanged() {
        // Arrange
        String text = "Great service!";

        // Act
        String censored = profanityFilterService.censorProfanity(text);

        // Assert
        assertEquals(text, censored);
    }

    @Test
    void testValidateText_ContainsProfanity_ThrowsException() {
        // Arrange
        String text = "This is shit";

        // Act & Assert
        assertThrows(ProfanityException.class, () -> {
            profanityFilterService.validateText(text);
        });
    }

    @Test
    void testValidateText_CleanText_DoesNotThrow() {
        // Arrange
        String text = "Great service!";

        // Act & Assert
        assertDoesNotThrow(() -> {
            profanityFilterService.validateText(text);
        });
    }

    @Test
    void testContainsProfanity_FrenchWithAccents_ReturnsTrue() {
        // Arrange
        String text = "C'est enculé!";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertTrue(result);
    }

    @Test
    void testContainsProfanity_MixedLanguages_ReturnsTrue() {
        // Arrange
        String text = "This is merde and shit";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertTrue(result);
    }

    @Test
    void testContainsProfanity_ProfanityInMiddleOfWord_ReturnsFalse() {
        // Arrange - "assessment" contains "ass" but should not be flagged
        String text = "I need an assessment of this service";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertFalse(result);
    }

    @Test
    void testContainsProfanity_CaseInsensitive_ReturnsTrue() {
        // Arrange
        String text = "This is SHIT and ShIt";

        // Act
        boolean result = profanityFilterService.containsProfanity(text);

        // Assert
        assertTrue(result);
    }

    @Test
    void testContainsProfanity_FrenchAbbreviations_ReturnsTrue() {
        // Arrange - Test fdp (fils de pute)
        String text1 = "fdp ce service";
        String text2 = "ntm"; // nique ta mère
        String text3 = "va tg"; // ta gueule

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_FrenchMultiWord_ReturnsTrue() {
        // Arrange
        String text1 = "fils de pute";
        String text2 = "nique ta mere";
        String text3 = "ta gueule";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_EnglishVariations_ReturnsTrue() {
        // Arrange
        String text1 = "This is fucking great";
        String text2 = "You're a mofo"; // motherfucker abbreviation
        String text3 = "What a douchebag";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_LeetspeakNumbers_ReturnsTrue() {
        // Arrange - Test leetspeak with numbers
        String text1 = "sh1t happens";
        String text2 = "b1tch please";
        String text3 = "a55hole driver";
        String text4 = "fuc3 this";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
        assertTrue(profanityFilterService.containsProfanity(text4));
    }

    @Test
    void testContainsProfanity_WithSeparators_ReturnsTrue() {
        // Arrange - Words with separators
        String text1 = "f-u-c-k you";
        String text2 = "s.h.i.t service";
        String text3 = "b*tch move";
        String text4 = "d_i_c_k head";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
        assertTrue(profanityFilterService.containsProfanity(text4));
    }

    @Test
    void testContainsProfanity_FrenchSlang_ReturnsTrue() {
        // Arrange - Common French slang
        String text1 = "quel bouffon";
        String text2 = "sale boloss";
        String text3 = "espèce de baltringue";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_CommonAbbreviations_ReturnsTrue() {
        // Arrange - Common abbreviations
        String text1 = "wtf is this";
        String text2 = "stfu now";
        String text3 = "gtfo here";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_CleanWords_ReturnsFalse() {
        // Arrange - Clean words that might contain profanity substrings
        String text1 = "I need an assessment";
        String text2 = "Classic music is great";
        String text3 = "Analytics dashboard";
        String text4 = "Association meeting";

        // Act & Assert
        assertFalse(profanityFilterService.containsProfanity(text1));
        assertFalse(profanityFilterService.containsProfanity(text2));
        assertFalse(profanityFilterService.containsProfanity(text3));
        assertFalse(profanityFilterService.containsProfanity(text4));
    }

    @Test
    void testContainsProfanity_SlursDetected_ReturnsTrue() {
        // Arrange - Test that slurs are properly detected
        String text1 = "you faggot";
        String text2 = "stupid nigger";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
    }

    @Test
    void testContainsProfanity_ComplexFrenchPhrases_ReturnsTrue() {
        // Arrange - Complex French phrases
        String text1 = "va te faire foutre";
        String text2 = "ferme ta gueule";
        String text3 = "nique ta mere la pute";

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_RepeatedCharacters_ReturnsTrue() {
        // Arrange - Test bypasses using repeated characters
        String text1 = "fdpppppp"; // fdp with extra p's
        String text2 = "shiiiiit"; // shit with extra i's
        String text3 = "fuuuuuck"; // fuck with extra u's
        String text4 = "biiiitch"; // bitch with extra i's
        String text5 = "meeerrrde"; // merde with extra letters
        String text6 = "connnnard"; // connard with extra n's
        String text7 = "ntmmmmm"; // ntm with extra m's

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1), "Should detect fdpppppp");
        assertTrue(profanityFilterService.containsProfanity(text2), "Should detect shiiiiit");
        assertTrue(profanityFilterService.containsProfanity(text3), "Should detect fuuuuuck");
        assertTrue(profanityFilterService.containsProfanity(text4), "Should detect biiiitch");
        assertTrue(profanityFilterService.containsProfanity(text5), "Should detect meeerrrde");
        assertTrue(profanityFilterService.containsProfanity(text6), "Should detect connnnard");
        assertTrue(profanityFilterService.containsProfanity(text7), "Should detect ntmmmmm");
    }

    @Test
    void testContainsProfanity_MixedRepeatedAndLeetspeak_ReturnsTrue() {
        // Arrange - Combine repeated chars with leetspeak
        String text1 = "sh111t"; // sh1t with repeated 1's
        String text2 = "a555hole"; // a55hole with extra 5's
        String text3 = "b1111tch"; // b1tch with repeated 1's

        // Act & Assert
        assertTrue(profanityFilterService.containsProfanity(text1));
        assertTrue(profanityFilterService.containsProfanity(text2));
        assertTrue(profanityFilterService.containsProfanity(text3));
    }

    @Test
    void testContainsProfanity_CleanWordsWithRepeatedChars_ReturnsFalse() {
        // Arrange - Clean words that naturally have repeated characters
        String text1 = "balloon"; // has 'll' and 'oo'
        String text2 = "bookkeeper"; // has repeated letters
        String text3 = "successful"; // has 'cc' and 'ss'
        String text4 = "Mississippi"; // has repeated letters

        // Act & Assert
        assertFalse(profanityFilterService.containsProfanity(text1));
        assertFalse(profanityFilterService.containsProfanity(text2));
        assertFalse(profanityFilterService.containsProfanity(text3));
        assertFalse(profanityFilterService.containsProfanity(text4));
    }
}
