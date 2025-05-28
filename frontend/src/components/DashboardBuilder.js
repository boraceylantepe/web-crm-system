import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Modal, 
  Form, 
  ListGroup,
  Badge,
  Alert
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaGripVertical, 
  FaExpand,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import {
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  MetricCard,
  ProgressBarChart,
  DataTable,
  chartUtils
} from './charts/ChartComponents';
import reportingService from '../services/reportingService';

const DashboardBuilder = ({ onSave, initialWidgets = [] }) => {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Widget form state
  const [widgetForm, setWidgetForm] = useState({
    name: '',
    widget_type: 'metric_card',
    data_source: '',
    size: 'medium',
    filters: {},
    display_options: {
      title: '',
      color: 'primary',
      showLabels: true
    }
  });

  useEffect(() => {
    loadAvailableWidgets();
  }, []);

  const loadAvailableWidgets = async () => {
    try {
      const response = await reportingService.widgets.getWidgets();
      setAvailableWidgets(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading widgets:', error);
      setError('Failed to load available widgets');
    }
  };

  const handleCreateWidget = () => {
    setSelectedWidget(null);
    setWidgetForm({
      name: '',
      widget_type: 'metric_card',
      data_source: '',
      size: 'medium',
      filters: {},
      display_options: {
        title: '',
        color: 'primary',
        showLabels: true
      }
    });
    setShowWidgetModal(true);
  };

  const handleEditWidget = (widget) => {
    setSelectedWidget(widget);
    setWidgetForm({
      name: widget.name,
      widget_type: widget.widget_type,
      data_source: widget.data_source,
      size: widget.size,
      filters: widget.filters || {},
      display_options: widget.display_options || {
        title: widget.name,
        color: 'primary',
        showLabels: true
      }
    });
    setShowWidgetModal(true);
  };

  const handleSaveWidget = async () => {
    try {
      setLoading(true);
      
      if (selectedWidget) {
        await reportingService.widgets.updateWidget(selectedWidget.id, widgetForm);
      } else {
        await reportingService.widgets.createWidget(widgetForm);
      }
      
      setShowWidgetModal(false);
      await loadAvailableWidgets();
    } catch (error) {
      console.error('Error saving widget:', error);
      setError('Failed to save widget');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      try {
        await reportingService.widgets.deleteWidget(widgetId);
        await loadAvailableWidgets();
        
        // Remove from current dashboard if it exists
        setWidgets(prevWidgets => 
          prevWidgets.filter(w => w.id !== widgetId)
        );
      } catch (error) {
        console.error('Error deleting widget:', error);
        setError('Failed to delete widget');
      }
    }
  };

  const handleAddToDashboard = (widget) => {
    // Check if widget is already on dashboard
    if (widgets.find(w => w.id === widget.id)) {
      setError('Widget is already on the dashboard');
      return;
    }

    // Find next available position
    const maxRow = Math.max(...widgets.map(w => w.position_y), -1);
    const newWidget = {
      ...widget,
      position_x: 0,
      position_y: maxRow + 1
    };

    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
  };

  const handleRemoveFromDashboard = (widgetId) => {
    setWidgets(prevWidgets => 
      prevWidgets.filter(w => w.id !== widgetId)
    );
  };

  const handleDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidget) => {
    e.preventDefault();
    
    if (!draggedWidget || draggedWidget.id === targetWidget.id) {
      return;
    }

    // Swap positions
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => {
        if (widget.id === draggedWidget.id) {
          return {
            ...widget,
            position_x: targetWidget.position_x,
            position_y: targetWidget.position_y
          };
        }
        if (widget.id === targetWidget.id) {
          return {
            ...widget,
            position_x: draggedWidget.position_x,
            position_y: draggedWidget.position_y
          };
        }
        return widget;
      })
    );

    setDraggedWidget(null);
  };

  const handleSaveDashboard = () => {
    if (onSave) {
      onSave(widgets);
    }
  };

  const handleResetDashboard = () => {
    setWidgets(initialWidgets);
  };

  const renderWidget = (widget) => {
    const props = {
      title: widget.display_options?.title || widget.name,
      height: widget.size === 'small' ? 200 : widget.size === 'large' ? 400 : 300,
      ...widget.display_options
    };

    // This would be connected to real data in production
    const sampleData = chartUtils.formatTimeSeriesData(
      [
        { period: '2024-01-01', count: 10 },
        { period: '2024-02-01', count: 15 },
        { period: '2024-03-01', count: 12 }
      ],
      'Sample Data'
    );

    switch (widget.widget_type) {
      case 'line_chart':
        return <LineChart data={sampleData} {...props} />;
      case 'bar_chart':
        return <BarChart data={sampleData} {...props} />;
      case 'pie_chart':
        return <PieChart data={sampleData} {...props} />;
      case 'donut_chart':
        return <DoughnutChart data={sampleData} {...props} />;
      case 'metric_card':
        return (
          <MetricCard
            title={props.title}
            value="1,234"
            change="12.5"
            changeType="positive"
            subtitle="This month"
          />
        );
      case 'progress_bar':
        return (
          <ProgressBarChart
            title={props.title}
            value={75}
            max={100}
            color={props.color}
          />
        );
      default:
        return (
          <Card>
            <Card.Body>
              <h6>{props.title}</h6>
              <p>Widget type: {widget.widget_type}</p>
            </Card.Body>
          </Card>
        );
    }
  };

  const getGridClass = (size) => {
    switch (size) {
      case 'small': return 'col-md-3';
      case 'large': return 'col-md-6';
      case 'xlarge': return 'col-md-12';
      default: return 'col-md-4';
    }
  };

  return (
    <Container fluid>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>Dashboard Builder</h4>
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={handleResetDashboard}
              >
                <FaUndo className="me-1" />
                Reset
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={handleSaveDashboard}
              >
                <FaSave className="me-1" />
                Save Dashboard
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Widget Library */}
        <Col md={3}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Widget Library</h6>
              <Button variant="primary" size="sm" onClick={handleCreateWidget}>
                <FaPlus />
              </Button>
            </Card.Header>
            <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <ListGroup variant="flush">
                {availableWidgets.map(widget => (
                  <ListGroup.Item 
                    key={widget.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{widget.name}</strong>
                      <br />
                      <Badge bg="secondary" className="me-1">
                        {widget.widget_type.replace('_', ' ')}
                      </Badge>
                      <Badge bg="info">
                        {widget.size}
                      </Badge>
                    </div>
                    <div>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-1"
                        onClick={() => handleAddToDashboard(widget)}
                      >
                        <FaPlus />
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEditWidget(widget)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteWidget(widget.id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Dashboard Preview */}
        <Col md={9}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Dashboard Preview</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                {widgets
                  .sort((a, b) => a.position_y - b.position_y || a.position_x - b.position_x)
                  .map(widget => (
                    <div
                      key={widget.id}
                      className={getGridClass(widget.size)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, widget)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, widget)}
                      style={{ cursor: 'move' }}
                    >
                      <div className="position-relative mb-3">
                        <div className="position-absolute top-0 end-0 p-2" style={{ zIndex: 10 }}>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveFromDashboard(widget.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                        <div className="position-absolute top-0 start-0 p-2" style={{ zIndex: 10 }}>
                          <FaGripVertical className="text-muted" />
                        </div>
                        {renderWidget(widget)}
                      </div>
                    </div>
                  ))}
                
                {widgets.length === 0 && (
                  <Col>
                    <div className="text-center text-muted p-5">
                      <h5>No widgets added yet</h5>
                      <p>Add widgets from the library to build your dashboard</p>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Widget Creation/Edit Modal */}
      <Modal show={showWidgetModal} onHide={() => setShowWidgetModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedWidget ? 'Edit Widget' : 'Create New Widget'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Widget Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={widgetForm.name}
                    onChange={(e) => setWidgetForm({
                      ...widgetForm,
                      name: e.target.value
                    })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Widget Type</Form.Label>
                  <Form.Select
                    value={widgetForm.widget_type}
                    onChange={(e) => setWidgetForm({
                      ...widgetForm,
                      widget_type: e.target.value
                    })}
                  >
                    <option value="metric_card">Metric Card</option>
                    <option value="line_chart">Line Chart</option>
                    <option value="bar_chart">Bar Chart</option>
                    <option value="pie_chart">Pie Chart</option>
                    <option value="donut_chart">Donut Chart</option>
                    <option value="progress_bar">Progress Bar</option>
                    <option value="table">Data Table</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Source</Form.Label>
                  <Form.Select
                    value={widgetForm.data_source}
                    onChange={(e) => setWidgetForm({
                      ...widgetForm,
                      data_source: e.target.value
                    })}
                  >
                    <option value="">Select data source...</option>
                    <option value="sales_performance">Sales Performance</option>
                    <option value="customer_engagement">Customer Engagement</option>
                    <option value="task_completion">Task Completion</option>
                    <option value="dashboard_kpis">Dashboard KPIs</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Size</Form.Label>
                  <Form.Select
                    value={widgetForm.size}
                    onChange={(e) => setWidgetForm({
                      ...widgetForm,
                      size: e.target.value
                    })}
                  >
                    <option value="small">Small (1x1)</option>
                    <option value="medium">Medium (2x1)</option>
                    <option value="large">Large (2x2)</option>
                    <option value="xlarge">Extra Large (3x2)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Display Title</Form.Label>
              <Form.Control
                type="text"
                value={widgetForm.display_options.title}
                onChange={(e) => setWidgetForm({
                  ...widgetForm,
                  display_options: {
                    ...widgetForm.display_options,
                    title: e.target.value
                  }
                })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color Theme</Form.Label>
              <Form.Select
                value={widgetForm.display_options.color}
                onChange={(e) => setWidgetForm({
                  ...widgetForm,
                  display_options: {
                    ...widgetForm.display_options,
                    color: e.target.value
                  }
                })}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="success">Success</option>
                <option value="danger">Danger</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWidgetModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveWidget}
            disabled={loading}
          >
            {loading ? 'Saving...' : selectedWidget ? 'Update' : 'Create'} Widget
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DashboardBuilder; 