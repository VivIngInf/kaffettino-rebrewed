import ServiceCard from "@/components/home/services-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownCircle, ArrowRight, ArrowUpRight } from "lucide-react";

export default async function LocalePage() {
  return (
    <main className="flex flex-col">
      <div className="max-w-2xl flex flex-col items-center gap-4 mx-auto px-4 justify-center min-h-screen">
        <Badge variant={"outline"}>
          Prova Kaffettino Rebrewed <ArrowUpRight className="w-4! h-4!" />
        </Badge>
        <div className="text-center tracking-wider">
          <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-black">
            Tutti i tuoi servizi,
          </h1>
          <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-black title-gradient">
            a portata di click.
          </h1>
          <p className="mt-6 text-md sm:text-md md:text-lg lg:text-xl text-gray-600">
            Accedi ai servizi che Vivere Ateneo ti offre, con un semplice click.
            (E gustati un bel caffé!)
          </p>
        </div>
        <a href="#services" className="w-full flex justify-center mt-10">
          <ArrowDownCircle className="absolute bottom-10 w-10! h-10! text-primary animate-bounce"></ArrowDownCircle>
        </a>
      </div>

      <div id="services" className="flex flex-col max-w-5xl mx-auto px-4 py-16">
        <div className="col-span-full text-center mt-16 mb-16">
          <h1 className="text-3xl sm:text-3xl md:text-3xl lg:text-5xl font-black title-gradient">
            I nostri servizi
          </h1>
          <p className="mt-4 text-md sm:text-md md:text-xl lg:text-xl text-gray-600">
            Scopri i servizi esclusivi che offriamo per migliorare la tua
            esperienza universitaria.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <ServiceCard
            title="Vivere Kaffettino"
            description="Prenditi una pausa con il miglior caffè, al miglior prezzo, per i nostri associati."
            link="#vivere-kaffettino"
            imageSrc="/path/to/image.jpg"
          ></ServiceCard>
          <ServiceCard
            title="Vivere Store"
            description="Acquista i prodotti ufficiali di Vivere Ateneo e supporta le nostre iniziative."
            link="#vivere-store"
            imageSrc="/path/to/image2.jpg"
          ></ServiceCard>
          <ServiceCard
            title="Vivere Events"
            description="Partecipa agli eventi esclusivi organizzati da Vivere Ateneo per i nostri membri."
            link="#vivere-events"
            imageSrc="/path/to/image3.jpg"
          ></ServiceCard>
          <ServiceCard
            title="Vivere Support"
            description="Hai bisogno di assistenza? Il nostro team è qui per aiutarti con qualsiasi domanda o problema."
            link="#vivere-support"
            imageSrc="/path/to/image4.jpg"
          ></ServiceCard>
        </div>
      </div>

      <div id="troubleshooting">
        <div className="col-span-full text-center mt-16 mb-16">
          <h1 className="text-3xl sm:text-3xl md:text-3xl lg:text-5xl font-black title-gradient">
            Problemi di accesso ai servizi?
          </h1>
          <p className="mt-4 text-md sm:text-md md:text-xl lg:text-xl text-gray-600">
            Se riscontri difficoltà nell&apos;accesso ai nostri servizi, non
            esitare a contattarci. Siamo qui per aiutarti!
          </p>
        </div>
        <div>
          {/* componente che reindirizza al segnalatore problemi, mettere anche form di contatto */}
        </div>
      </div>
    </main>
  );
}
