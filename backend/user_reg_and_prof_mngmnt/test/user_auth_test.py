import unittest
from unittest.mock import patch, MagicMock
from user_reg_and_prof_mngmnt.dependencies import get_user_by_id
from user_reg_and_prof_mngmnt.schemas import BasicProfile

class TestGetUserById(unittest.TestCase):

    @patch('dependencies.user_collection.find_one')
    def test_get_user_by_id_found(self, mock_find_one):
        mock_user_data = {
            "telegram_user_id": "12345",
            "username": "test_user",
            "firstname": "Test",
            "image_url": "http://example.com/image.jpg",
            "total_coins": 100,
            "level": 2,
            "referral_url": "http://example.com/referral"
        }
        mock_find_one.return_value = mock_user_data

        result = get_user_by_id("12345")
        expected_result = BasicProfile(
            telegram_user_id="12345",
            username="test_user",
            firstname="Test",
            image_url="http://example.com/image.jpg",
            total_coins=100,
            level=2,
            referral_url="http://example.com/referral"
        )

        self.assertEqual(result, expected_result)

    @patch('user_reg_and_prof_mngmnt.dependencies.user_collection.find_one')
    def test_get_user_by_id_not_found(self, mock_find_one):
        mock_find_one.return_value = None

        result = get_user_by_id("67890")
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()