import { ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import Image from "next/image";
import Link from "next/link";

export default async function ServiceCard({
  title,
  description,
  link,
  imageSrc,
}: {
  title: string;
  description: string;
  link: string;
  imageSrc?: string;
}) {
  return (
    <Link href={link}>
      <Card
        className="group hover:-translate-y-1 hover:shadow-xl w-full
                      transition-all duration-300
                      bg-linear-to-br from-white via-white to-primary/10
                      md:max-h-45"
      >
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="w-20 h-20 aspect-square bg-primary rounded-lg">
            {imageSrc && (
              <Image
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover rounded-lg"
                width={80}
                height={80}
              />
            )}
          </div>

          <div className="flex flex-col">
            <CardTitle className="text-lg md:text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <a
            href={link}
            className="text-primary/80 font-medium flex
                          flex-row items-center gap-1 opacity-0 
                          group-hover:opacity-100 transition-all 
                          group-hover:translate-x-1
                          hover:translate-x-2 duration-300
                          absolute bottom-4 left-6"
          >
            Scopri di più <ArrowRight className="h-4! w-4!"></ArrowRight>
          </a>
        </CardContent>
      </Card>
    </Link>
  );
}
