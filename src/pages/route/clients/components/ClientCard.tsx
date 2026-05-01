import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon
} from '@ionic/react';
import { add, create, trash, card, eye, eyeOff } from 'ionicons/icons';
import { Client } from '../../../../services/clientApi';
import { useTranslation } from 'react-i18next';

interface ClientCardProps {
  client: Client;
  onAddCredit: (client: Client) => void;
  onViewCredits: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  formatCurrency: (value: number) => string;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onAddCredit,
  onViewCredits,
  onEdit,
  onDelete,
  formatCurrency
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const totalDebt = client.totalCreditsValue - client.totalDebitsValue;

  return (
    <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
      <IonCardHeader>
        <IonCardTitle>{client.name}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel>
                  <h3>{t('pages.clients.credits')}: {client.creditsCount}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
            <IonCol size="12">
              <IonItem>
                <IonLabel>
                  <h3>
                    {t('pages.clients.totalDebt')}: {formatCurrency(totalDebt)}
                  </h3>
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>

          {showDetails && (
            <IonRow>
              <IonCol size="12">
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.clients.cpf')}: {client.cpf || t('pages.clients.notProvided')}</h3>
                  </IonLabel>
                </IonItem>
              </IonCol>
              <IonCol size="12">
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.clients.phone')}: {client.phone || t('pages.clients.notProvided')}</h3>
                  </IonLabel>
                </IonItem>
              </IonCol>
              <IonCol size="12">
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.clients.shop')}: {client.shop || t('pages.clients.notProvidedFemale')}</h3>
                  </IonLabel>
                </IonItem>
              </IonCol>
              <IonCol size="12">
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.clients.address')}: {client.address || t('pages.clients.notProvided')}</h3>
                  </IonLabel>
                </IonItem>
              </IonCol>
              <IonCol size="12">
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.clients.debits')}: {client.debitsCount}</h3>
                  </IonLabel>
                </IonItem>
              </IonCol>
            </IonRow>
          )}

          <IonRow>
            <IonCol size="3">
              <IonButton fill="clear" onClick={() => setShowDetails(!showDetails)}>
                <IonIcon icon={showDetails ? eyeOff : eye} />
              </IonButton>
            </IonCol>
            <IonCol size="3">
              <IonButton fill="clear" onClick={() => onAddCredit(client)}>
                <IonIcon icon={add} />
              </IonButton>
            </IonCol>
            <IonCol size="3">
              <IonButton fill="clear" onClick={() => onViewCredits(client)}>
                <IonIcon icon={card} />
              </IonButton>
            </IonCol>
            <IonCol size="3">
              <IonButton fill="clear" onClick={() => onEdit(client)}>
                <IonIcon icon={create} />
              </IonButton>
            </IonCol>
            <IonCol size="3">
              <IonButton
                fill="clear"
                color="danger"
                onClick={() => onDelete(client)}
              >
                <IonIcon icon={trash} />
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default ClientCard;
