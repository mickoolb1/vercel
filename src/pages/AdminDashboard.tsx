
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Clock, QrCode, TicketIcon, ShieldCheck, FileImage } from 'lucide-react';
import { 
  getAllTickets, 
  Ticket, 
  getPendingTickets,
  PendingTicket,
  getUserTickets,
  deletePendingTicketPaymentProof
} from '@/utils/ticketUtils';
import { toast } from 'sonner';

// Import our components
import TicketValidator from '@/components/admin/TicketValidator';
import PendingTickets from '@/components/admin/PendingTickets';
import TicketsTable from '@/components/admin/TicketsTable';
import SecurityAdmin from '@/components/admin/SecurityAdmin';
import TicketDetailDialog from '@/components/admin/TicketDetailDialog';
import CustomerTicketsDialog from '@/components/admin/CustomerTicketsDialog';
import TicketAvailability from '@/components/admin/TicketAvailability';
import PaymentScreenshots from '@/components/admin/PaymentScreenshots';

const AdminDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    ticket?: Ticket;
  } | null>(null);
  
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [showTicketsDialog, setShowTicketsDialog] = useState(false);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetailDialog, setShowTicketDetailDialog] = useState(false);

  const loadData = () => {
    const loadedTickets = getAllTickets();
    const loadedPendingTickets = getPendingTickets();
    setTickets(loadedTickets);
    setPendingTickets(loadedPendingTickets);
  };

  useEffect(() => {
    loadData();
  }, [validationResult]);

  const viewGeneratedTickets = (customerEmail: string) => {
    const userTickets = getUserTickets(customerEmail);
    setSelectedTickets(userTickets);
    setSelectedCustomerEmail(customerEmail);
    setShowTicketsDialog(true);
  };

  const handleTicketDetailView = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetailDialog(true);
    console.log(`Ver boleto: ${ticket.id}`);
  };

  const handleDeletePaymentProof = (ticketId: string) => {
    try {
      deletePendingTicketPaymentProof(ticketId);
      loadData(); // Reload data after deletion
      toast.success("Comprobante eliminado correctamente");
    } catch (error) {
      toast.error("Error al eliminar el comprobante");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Layout>
      <div className="bg-gradient-to-b from-magic-light/50 to-white py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-magic-dark">Panel de Administración</h1>
              <p className="text-magic-dark/70">
                Bienvenido, {user?.username}. Aquí puedes validar boletos y administrar el sistema.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => {
                    const tickets = getAllTickets();
                    const dataStr = JSON.stringify(tickets);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `tickets-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Exportar Base de Datos
                </Button>
                <input
                  type="file"
                  id="importTickets"
                  className="hidden"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const tickets = JSON.parse(event.target?.result as string);
                          localStorage.setItem('magicticket_tickets', JSON.stringify(tickets));
                          loadData(); // Actualizar los datos
                          toast.success("Base de datos importada correctamente");
                        } catch (error) {
                          toast.error("Error al importar la base de datos");
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => document.getElementById('importTickets')?.click()}
                >
                  Importar Base de Datos
                </Button>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-magic hover:bg-magic-light"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
          
          {/* Mostrar el componente de disponibilidad de boletos */}
          <TicketAvailability />
          
          <Tabs defaultValue="pending">
            <TabsList className="bg-white border border-magic-light">
              <TabsTrigger value="pending" className="data-[state=active]:bg-magic data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" />
                Pagos Pendientes
              </TabsTrigger>
              <TabsTrigger value="screenshots" className="data-[state=active]:bg-magic data-[state=active]:text-white">
                <FileImage className="h-4 w-4 mr-2" />
                Comprobantes
              </TabsTrigger>
              <TabsTrigger value="validate" className="data-[state=active]:bg-magic data-[state=active]:text-white">
                <QrCode className="h-4 w-4 mr-2" />
                Validar Boletos
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-magic data-[state=active]:text-white">
                <TicketIcon className="h-4 w-4 mr-2" />
                Boletos
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-magic data-[state=active]:text-white">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Seguridad
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
              <PendingTickets 
                pendingTickets={pendingTickets} 
                setPendingTickets={setPendingTickets} 
                setTickets={setTickets}
                viewGeneratedTickets={viewGeneratedTickets}
              />
            </TabsContent>
            
            <TabsContent value="screenshots" className="mt-6">
              <PaymentScreenshots 
                pendingTickets={pendingTickets} 
                onDelete={handleDeletePaymentProof} 
              />
            </TabsContent>
            
            <TabsContent value="validate" className="mt-6">
              <TicketValidator 
                validationResult={validationResult} 
                setValidationResult={setValidationResult} 
              />
            </TabsContent>
            
            <TabsContent value="tickets" className="mt-6">
              <TicketsTable 
                tickets={tickets} 
                onDelete={loadData}
              />
            </TabsContent>
            
            <TabsContent value="security" className="mt-6">
              <SecurityAdmin />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CustomerTicketsDialog
        open={showTicketsDialog}
        onOpenChange={setShowTicketsDialog}
        selectedTickets={selectedTickets}
        customerEmail={selectedCustomerEmail}
        onViewTicketDetail={handleTicketDetailView}
      />

      <TicketDetailDialog
        open={showTicketDetailDialog}
        onOpenChange={setShowTicketDetailDialog}
        selectedTicket={selectedTicket}
      />
    </Layout>
  );
};

export default AdminDashboard;
