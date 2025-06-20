# Contributing to Web-Based CRM System

Thank you for your interest in contributing to our CRM system! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome newcomers and help them get started
- **Be Collaborative**: Work together and help each other
- **Be Professional**: Keep discussions focused and constructive

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**
- **Git**
- **GitHub account**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/web-crm-system.git
   cd web-crm-system
   ```
3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/boraceylantepe/web-crm-system.git
   ```

## 🛠 Development Setup

### Backend Setup

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment configuration:**
   ```bash
   # Copy example environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database setup:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Reports**: Help us identify and fix issues
- **💡 Feature Requests**: Suggest new features or improvements
- **📝 Documentation**: Improve or add documentation
- **🧪 Tests**: Add or improve test coverage
- **🔧 Code**: Fix bugs or implement new features

### Before You Start

1. **Check existing issues**: Look for existing issues or discussions
2. **Create an issue**: For new features or major changes, create an issue first
3. **Discuss**: Get feedback before starting significant work

### Branch Naming Convention

Use descriptive branch names:

- `feature/add-customer-export` - For new features
- `bugfix/fix-login-redirect` - For bug fixes
- `docs/update-api-documentation` - For documentation
- `test/add-unit-tests` - For adding tests

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, readable code
- Follow coding standards
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test

# Run linting
npm run lint
```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add customer export functionality"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for customer service"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:

- **Clear title**: Descriptive and concise
- **Detailed description**: What changes were made and why
- **Related issues**: Link to related issues using `#issue-number`
- **Screenshots**: For UI changes, include before/after screenshots
- **Testing**: Describe how you tested the changes

### 6. Review Process

- **Code Review**: Maintainers will review your code
- **Feedback**: Address any feedback or requested changes
- **Approval**: Once approved, your PR will be merged

## 💻 Coding Standards

### Python (Backend)

- **PEP 8**: Follow Python style guide
- **Type Hints**: Use type hints where appropriate
- **Docstrings**: Document functions and classes
- **Error Handling**: Use proper exception handling

```python
def create_customer(data: dict) -> Customer:
    """
    Create a new customer with the provided data.
    
    Args:
        data: Dictionary containing customer information
        
    Returns:
        Customer: The created customer instance
        
    Raises:
        ValidationError: If the data is invalid
    """
    try:
        # Implementation here
        pass
    except Exception as e:
        logger.error(f"Failed to create customer: {e}")
        raise
```

### JavaScript (Frontend)

- **ESLint**: Follow ESLint configuration
- **JSDoc**: Document functions and components
- **Consistent Naming**: Use camelCase for variables, PascalCase for components
- **Component Structure**: Keep components focused and reusable

```javascript
/**
 * Customer list component for displaying and managing customers
 * @param {Object} props - Component props
 * @param {Array} props.customers - Array of customer objects
 * @param {Function} props.onCustomerSelect - Callback when customer is selected
 * @returns {JSX.Element} Customer list component
 */
const CustomerList = ({ customers, onCustomerSelect }) => {
  // Component implementation
};
```

### Database

- **Migrations**: Always create migrations for schema changes
- **Naming**: Use descriptive names for models and fields
- **Relationships**: Define proper foreign key relationships
- **Indexes**: Add indexes for frequently queried fields

## 🧪 Testing Guidelines

### Backend Testing

- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test API endpoints and database interactions
- **Coverage**: Aim for 80%+ test coverage

```python
class CustomerTestCase(TestCase):
    def setUp(self):
        self.customer_data = {
            'name': 'Test Customer',
            'email': 'test@example.com'
        }
    
    def test_create_customer(self):
        customer = Customer.objects.create(**self.customer_data)
        self.assertEqual(customer.name, 'Test Customer')
        self.assertEqual(customer.email, 'test@example.com')
```

### Frontend Testing

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **User Tests**: Test user workflows

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerForm from './CustomerForm';

test('submits customer form with valid data', () => {
  const mockSubmit = jest.fn();
  render(<CustomerForm onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: 'Test Customer' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(mockSubmit).toHaveBeenCalledWith({
    name: 'Test Customer'
  });
});
```

## 📚 Documentation

### Code Documentation

- **Python**: Use docstrings for all functions, classes, and modules
- **JavaScript**: Use JSDoc comments for functions and components
- **API**: Document all API endpoints with parameters and responses

### User Documentation

- **README**: Keep the main README up to date
- **API Docs**: Update API documentation for new endpoints
- **User Guides**: Create guides for new features

## 🏷️ Issue Labels

We use the following labels to categorize issues:

- **`bug`**: Something isn't working
- **`enhancement`**: New feature or request
- **`documentation`**: Improvements to documentation
- **`good first issue`**: Good for newcomers
- **`help wanted`**: Extra attention is needed
- **`question`**: Further information is requested
- **`wontfix`**: This will not be worked on

## 📞 Getting Help

If you need help:

1. **Check Documentation**: Review existing documentation first
2. **Search Issues**: Look for similar issues or questions
3. **Create Discussion**: Start a discussion for general questions
4. **Create Issue**: Report bugs or request features

## 🎉 Recognition

Contributors will be recognized in:

- **Contributors Section**: Added to README.md
- **Release Notes**: Mentioned in relevant releases
- **Special Thanks**: For significant contributions

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Web-Based CRM System! 🚀 