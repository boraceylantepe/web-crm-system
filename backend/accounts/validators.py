import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class PasswordComplexityValidator:
    """
    Validate that the password meets complexity requirements:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    
    def __init__(self):
        self.password_regex = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]+$')
    
    def validate(self, password, user=None):
        if not self.password_regex.match(password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter, one lowercase letter, "
                  "one digit, and one special character (@$!%*?&.)."),
                code='password_too_simple',
            )
    
    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter, one lowercase letter, "
            "one digit, and one special character (@$!%*?&.)."
        ) 